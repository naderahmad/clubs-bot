import { env } from "./env";
import { db } from "./supabase";
import { getMatches, parseResult, type EaMatch, type EaMatchType } from "./ea";
import { postMessage, mention, ts, NO_PINGS } from "./discord";
import { buildMatchEmbed, type Abandono } from "./match-embed";

const MATCH_TYPES: EaMatchType[] = ["leagueMatch", "friendlyMatch"];
interface Summary {
  fetched: number;
  newMatches: number;
  reds: number;
  yellows: number;
  closedSessions: number;
  reminders: number;
  errors: string[];
}

/** Paso único del cron: trae partidos, saca tarjetas, cierra convocatorias y manda recordatorios. */
export async function runSync({ dry = false } = {}) {
  const s: Summary = { fetched: 0, newMatches: 0, reds: 0, yellows: 0, closedSessions: 0, reminders: 0, errors: [] };
  const clubId = env.eaClubId;

  // 1. Traer los últimos partidos de EA
  const fetched: Array<{ m: EaMatch; type: EaMatchType }> = [];
  for (const type of MATCH_TYPES) {
    try {
      for (const m of await getMatches(clubId, type, env.eaPlatform)) fetched.push({ m, type });
    } catch (e) {
      s.errors.push(`EA ${type}: ${String(e)}`);
    }
  }
  s.fetched = fetched.length;
  if (dry) return { ...s, sample: fetched.slice(0, 3).map(({ m, type }) => summarizeMatch(m, type, clubId)) };

  // 2. Guardar los nuevos
  const ids = fetched.map((f) => f.m.matchId);
  const { data: existing } = ids.length
    ? await db().from("matches").select("match_id").in("match_id", ids)
    : { data: [] as { match_id: string }[] };
  const known = new Set((existing ?? []).map((r) => r.match_id));
  const fresh = fetched.filter((f) => !known.has(f.m.matchId)).sort((a, b) => a.m.timestamp - b.m.timestamp);

  for (const { m, type } of fresh) {
    try {
      await saveMatch(m, type, clubId);
      s.newMatches++;
      s.reds += await processMatch(m, type, clubId);
    } catch (e) {
      s.errors.push(`match ${m.matchId}: ${String(e)}`);
    }
  }

  // 3. Cerrar convocatorias ya terminadas (ausencias = amarillas)
  try {
    const r = await closeFinishedSessions();
    s.closedSessions = r.closed;
    s.yellows = r.yellows;
  } catch (e) {
    s.errors.push(`close: ${String(e)}`);
  }

  // 4. Recordatorios ~1 h antes
  try {
    s.reminders = await sendReminders();
  } catch (e) {
    s.errors.push(`reminders: ${String(e)}`);
  }

  return s;
}

function summarizeMatch(m: EaMatch, type: EaMatchType, clubId: string) {
  const club = m.clubs[clubId];
  const oppId = Object.keys(m.clubs).find((k) => k !== clubId);
  const players = Object.entries(m.players?.[clubId] ?? {}).map(([id, p]) => ({
    eaPlayerId: id,
    gamertag: p.playername,
    pos: p.pos,
    seconds: Number(p.secondsPlayed ?? 0),
    rating: Number(p.rating ?? 0),
    goals: Number(p.goals ?? 0),
    assists: Number(p.assists ?? 0),
    mom: p.mom === "1",
  }));
  return {
    matchId: m.matchId,
    playedAt: new Date(m.timestamp * 1000),
    type,
    goalsFor: Number(club?.goals ?? 0),
    goalsAgainst: Number(club?.goalsAgainst ?? 0),
    result: club ? parseResult(type, club) : "desconocido",
    opponent: (oppId && m.clubs[oppId]?.details?.name) || "Rival",
    players,
  };
}

async function saveMatch(m: EaMatch, type: EaMatchType, clubId: string) {
  const x = summarizeMatch(m, type, clubId);
  const { error } = await db().from("matches").insert({
    match_id: x.matchId,
    played_at: x.playedAt.toISOString(),
    match_type: type,
    goals_for: x.goalsFor,
    goals_against: x.goalsAgainst,
    result: x.result,
    opponent: x.opponent,
    raw: m,
  });
  if (error) throw error;

  if (x.players.length) {
    const { error: e2 } = await db().from("match_players").insert(
      x.players.map((p) => ({
        match_id: x.matchId,
        ea_player_id: p.eaPlayerId,
        gamertag: p.gamertag,
        pos: p.pos,
        seconds_played: p.seconds,
        rating: p.rating,
        goals: p.goals,
        assists: p.assists,
        mom: p.mom,
      })),
    );
    if (e2) throw e2;
  }

  // Resolver ea_player_id de quienes se vincularon por gamertag
  const { data: unlinked } = await db().from("players").select("discord_id, gamertag").is("ea_player_id", null).not("gamertag", "is", null);
  for (const pl of unlinked ?? []) {
    const hit = x.players.find((p) => p.gamertag?.toLowerCase() === String(pl.gamertag).toLowerCase());
    if (hit) await db().from("players").update({ ea_player_id: hit.eaPlayerId }).eq("discord_id", pl.discord_id);
  }
}

/** Mapa ea_player_id -> discord_id de los jugadores vinculados. */
async function linkedPlayers() {
  const { data } = await db().from("players").select("discord_id, ea_player_id").not("ea_player_id", "is", null);
  return new Map((data ?? []).map((p) => [String(p.ea_player_id), String(p.discord_id)]));
}

/** Busca la convocatoria a la que pertenece un partido. */
async function sessionForMatch(playedAt: Date) {
  const windowMs = env.sessionWindowHours * 3600_000;
  const { data } = await db()
    .from("sessions")
    .select()
    .lte("starts_at", new Date(playedAt.getTime() + 30 * 60_000).toISOString())
    .gte("starts_at", new Date(playedAt.getTime() - windowMs).toISOString())
    .order("starts_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

async function addCard(card: { discord_id: string; type: "amarilla" | "roja"; reason: string; session_id?: number; match_id?: string }) {
  // Evitar duplicados si el cron corre dos veces sobre lo mismo
  let q = db().from("cards").select("id").eq("discord_id", card.discord_id).eq("type", card.type).eq("auto", true);
  q = card.match_id ? q.eq("match_id", card.match_id) : q.is("match_id", null);
  q = card.session_id ? q.eq("session_id", card.session_id) : q.is("session_id", null);
  const { data } = await q.limit(1);
  if (data?.length) return false;
  const { error } = await db().from("cards").insert({ ...card, auto: true });
  if (error) throw error;
  return true;
}

/** Saca rojas a los confirmados que se fueron a mitad de partido y publica el resumen. */
async function processMatch(m: EaMatch, type: EaMatchType, clubId: string): Promise<number> {
  const x = summarizeMatch(m, type, clubId);
  const session = await sessionForMatch(x.playedAt);
  const abandonos: Abandono[] = [];

  if (session) {
    const linked = await linkedPlayers();
    const { data: rsvps } = await db().from("rsvps").select("discord_id").eq("session_id", session.id).eq("status", "voy");
    const confirmed = new Set((rsvps ?? []).map((r) => r.discord_id));
    const maxSeconds = Math.max(0, ...x.players.map((p) => p.seconds));

    for (const p of x.players) {
      const discordId = linked.get(p.eaPlayerId);
      if (!discordId || !confirmed.has(discordId)) continue;
      if (p.seconds > 0 && p.seconds < maxSeconds * env.leaverThreshold) {
        const pct = Math.round((p.seconds / maxSeconds) * 100);
        const added = await addCard({
          discord_id: discordId,
          type: "roja",
          reason: `Abandonó el partido vs ${x.opponent} (jugó ${pct}% del tiempo)`,
          session_id: session.id,
          match_id: x.matchId,
        });
        if (added) abandonos.push({ discordId, gamertag: p.gamertag, pct });
      }
    }
  }

  const embed = buildMatchEmbed(m, type, clubId, { appUrl: env.appUrl, crestUrl: env.crestUrl, abandonos });
  // Precalentar la imagen para que Discord la encuentre ya generada (si falla, el embed sale igual)
  await fetch(embed.image.url, { signal: AbortSignal.timeout(20_000) }).catch(() => {});
  await postMessage(env.discordChannelId, { embeds: [embed], allowed_mentions: NO_PINGS });
  return abandonos.length;
}

/** Convocatorias cuya ventana terminó: confirmados que no jugaron ningún partido = amarilla. */
async function closeFinishedSessions() {
  const windowMs = env.sessionWindowHours * 3600_000;
  const { data: sessions } = await db()
    .from("sessions")
    .select()
    .eq("closed", false)
    .lte("starts_at", new Date(Date.now() - windowMs).toISOString());

  let closed = 0, yellows = 0;
  for (const session of sessions ?? []) {
    const start = new Date(session.starts_at);
    const { data: matches } = await db()
      .from("matches")
      .select("match_id")
      .gte("played_at", new Date(start.getTime() - 30 * 60_000).toISOString())
      .lte("played_at", new Date(start.getTime() + windowMs).toISOString());

    const channel = session.channel_id ?? env.discordChannelId;
    const lines = [`### 🔒 Convocatoria cerrada · ${ts(start, "f")}`];

    if (!matches?.length) {
      lines.push("No se registró ningún partido del club en ese horario, así que no se sacan tarjetas.");
    } else {
      const matchIds = matches.map((mm) => mm.match_id);
      const { data: apps } = await db()
        .from("match_players")
        .select("ea_player_id, seconds_played")
        .in("match_id", matchIds)
        .gt("seconds_played", 0);
      const played = new Set((apps ?? []).map((a) => String(a.ea_player_id)));

      const { data: rsvps } = await db().from("rsvps").select("discord_id").eq("session_id", session.id).eq("status", "voy");
      const { data: players } = await db()
        .from("players")
        .select("discord_id, ea_player_id")
        .in("discord_id", (rsvps ?? []).map((r) => r.discord_id));

      const absent: string[] = [];
      for (const pl of players ?? []) {
        // Sin ea_player_id no podemos comprobar: no se sanciona (que use /vincular)
        if (!pl.ea_player_id || played.has(String(pl.ea_player_id))) continue;
        const added = await addCard({
          discord_id: pl.discord_id,
          type: "amarilla",
          reason: "Confirmó asistencia y no jugó",
          session_id: session.id,
        });
        if (added) { yellows++; absent.push(pl.discord_id); }
      }
      lines.push(`Partidos jugados: **${matches.length}**`);
      lines.push(absent.length ? `🟨 Confirmaron y no jugaron: ${absent.map(mention).join(", ")}` : "✅ Todos los confirmados cumplieron.");
    }

    await db().from("sessions").update({ closed: true }).eq("id", session.id);
    await postMessage(channel, { content: lines.join("\n"), allowed_mentions: NO_PINGS });
    closed++;
  }
  return { closed, yellows };
}

/** ~1 h antes: menciona a los jugadores registrados que no han respondido. */
async function sendReminders() {
  const now = Date.now();
  const { data: sessions } = await db()
    .from("sessions")
    .select()
    .eq("closed", false)
    .eq("reminder_sent", false)
    .gte("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + 75 * 60_000).toISOString());

  let sent = 0;
  for (const session of sessions ?? []) {
    const { data: rsvps } = await db().from("rsvps").select("discord_id, status").eq("session_id", session.id);
    const { data: players } = await db().from("players").select("discord_id");
    const answered = new Set((rsvps ?? []).map((r) => r.discord_id));
    const pending = (players ?? []).map((p) => p.discord_id).filter((id) => !answered.has(id));
    const going = (rsvps ?? []).filter((r) => r.status === "voy").length;

    const lines = [
      `⏰ **Partido ${ts(new Date(session.starts_at), "R")}** · confirmados: ${going}`,
      pending.length ? `Faltan por responder: ${pending.map(mention).join(" ")}` : "Todos respondieron 👌",
    ];
    // Aquí sí hacemos ping, pero solo a los que faltan
    await postMessage(session.channel_id ?? env.discordChannelId, {
      content: lines.join("\n"),
      allowed_mentions: { users: pending },
    });
    await db().from("sessions").update({ reminder_sent: true }).eq("id", session.id);
    sent++;
  }
  return sent;
}
