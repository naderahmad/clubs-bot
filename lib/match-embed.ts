/**
 * Resumen de partido como embed de Discord: resultado, MVP, goles, podio,
 * comparativa de estadísticas, plantilla y disciplina. Todo sale del JSON de EA.
 */
import { parseResult, type EaMatch, type EaMatchType } from "./ea";
import { ts } from "./discord";

export interface Abandono {
  discordId: string;
  gamertag: string;
  pct: number;
}

const COLOR: Record<string, number> = {
  victoria: 0x2ecc71,
  victoria_dnf: 0x2ecc71,
  derrota: 0xe74c3c,
  derrota_dnf: 0xe74c3c,
  empate: 0x95a5a6,
};

const TITLE: Record<string, string> = {
  victoria: "✅ VICTORIA",
  victoria_dnf: "✅ VICTORIA · el rival abandonó",
  derrota: "❌ DERROTA",
  derrota_dnf: "🏳️ DERROTA · abandonamos",
  empate: "➖ EMPATE",
};

const TYPE_LABEL: Record<EaMatchType, string> = {
  leagueMatch: "🏆 Liga",
  friendlyMatch: "🤝 Amistoso",
  playoffMatch: "🔥 Playoff",
};

const POS: Record<string, { label: string; order: number }> = {
  goalkeeper: { label: "POR", order: 0 },
  defender: { label: "DEF", order: 1 },
  midfielder: { label: "MED", order: 2 },
  forward: { label: "DEL", order: 3 },
};

const n = (v: unknown) => Number(v ?? 0) || 0;
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "-");
const cut = (s: string, len: number) => (s.length > len ? s.slice(0, len - 1) + "…" : s);

interface P {
  name: string;
  pos: string;
  rating: number;
  goals: number;
  assists: number;
  mom: boolean;
  seconds: number;
  redcards: number;
}

function players(m: EaMatch, clubId: string): P[] {
  return Object.values(m.players?.[clubId] ?? {}).map((p) => ({
    name: String(p.playername ?? "?"),
    pos: String(p.pos ?? ""),
    rating: n(p.rating),
    goals: n(p.goals),
    assists: n(p.assists),
    mom: p.mom === "1",
    seconds: n(p.secondsPlayed),
    redcards: n(p.redcards),
  }));
}

/** Totales del equipo: usa `aggregate` de EA y, si falta, suma los jugadores humanos. */
function teamStats(m: EaMatch & { aggregate?: Record<string, Record<string, unknown>> }, clubId: string) {
  const agg = m.aggregate?.[clubId];
  const sum = (k: string) =>
    agg ? n(agg[k]) : Object.values(m.players?.[clubId] ?? {}).reduce((t, p) => t + n(p[k]), 0);
  return {
    shots: sum("shots"),
    passes: sum("passesmade"),
    passAttempts: sum("passattempts"),
    tackles: sum("tacklesmade"),
    tackleAttempts: sum("tackleattempts"),
    saves: sum("saves"),
    reds: sum("redcards"),
  };
}

const byPerformance = (a: P, b: P) => b.rating - a.rating || b.goals - a.goals || b.assists - a.assists;

export function buildMatchEmbed(
  m: EaMatch,
  type: EaMatchType,
  clubId: string,
  opts: { crestUrl: string; abandonos?: Abandono[] },
) {
  const club = m.clubs[clubId];
  const oppId = Object.keys(m.clubs).find((k) => k !== clubId);
  const clubName = club?.details?.name || "STARLINK FCX";
  const opponent = (oppId && m.clubs[oppId]?.details?.name) || "Rival";
  const result = club ? parseResult(type, club) : "empate";
  const gf = n(club?.goals), ga = n(club?.goalsAgainst);
  const playedAt = new Date(m.timestamp * 1000);
  const ps = players(m, clubId);

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  // MVP (EA marca `mom`; si nadie lo tiene, el mejor valorado)
  const ranked = [...ps].sort(byPerformance);
  const mvp = ps.find((p) => p.mom) ?? ranked[0];
  if (mvp) {
    fields.push({
      name: ps.some((p) => p.mom) ? "⭐ MVP" : "⭐ Mejor valorado",
      value: `**${mvp.name}**\n\`${mvp.rating.toFixed(1)}\`${mvp.goals ? ` · ⚽ ${mvp.goals}` : ""}${mvp.assists ? ` · 🅰️ ${mvp.assists}` : ""}`,
      inline: true,
    });
  }

  const list = (k: "goals" | "assists") =>
    ps
      .filter((p) => p[k] > 0)
      .sort((a, b) => b[k] - a[k])
      .map((p) => `${p.name}${p[k] > 1 ? ` ×${p[k]}` : ""}`)
      .join("\n") || "—";
  fields.push({ name: "⚽ Goles", value: list("goals"), inline: true });
  fields.push({ name: "🅰️ Asistencias", value: list("assists"), inline: true });

  // Podio por rating
  const medals = ["🥇", "🥈", "🥉"];
  if (ranked.length) {
    fields.push({
      name: "🏅 Podio",
      value: ranked
        .slice(0, 3)
        .map((p, i) => {
          const extra = [p.goals && `⚽ ${p.goals}`, p.assists && `🅰️ ${p.assists}`].filter(Boolean).join(" ");
          return `${medals[i]} **${p.name}** · \`${p.rating.toFixed(1)}\` · ${POS[p.pos]?.label ?? p.pos}${extra ? ` · ${extra}` : ""}`;
        })
        .join("\n"),
    });
  }

  // Comparativa de equipos
  if (oppId) {
    const a = teamStats(m, clubId), b = teamStats(m, oppId);
    const head = [cut("STARLINK", 8), cut(opponent.toUpperCase(), 8)];
    const row = (label: string, x: string | number, y: string | number) =>
      `${label.padEnd(10)}${String(x).padStart(8)}  ${String(y).padStart(8)}`;
    fields.push({
      name: "📊 Estadísticas",
      value:
        "```\n" +
        [
          row("", head[0], head[1]),
          row("Tiros", a.shots, b.shots),
          row("Pases", pct(a.passes, a.passAttempts), pct(b.passes, b.passAttempts)),
          row("Entradas", pct(a.tackles, a.tackleAttempts), pct(b.tackles, b.tackleAttempts)),
          row("Paradas", a.saves, b.saves),
          row("Rojas", a.reds, b.reds),
        ].join("\n") +
        "\n```",
    });
  }

  // Plantilla por posición
  if (ps.length) {
    const sorted = [...ps].sort((x, y) => (POS[x.pos]?.order ?? 9) - (POS[y.pos]?.order ?? 9) || y.rating - x.rating);
    const lines = sorted.map((p) => {
      const ga = [p.goals && `${p.goals}G`, p.assists && `${p.assists}A`].filter(Boolean).join(" ");
      return `${(POS[p.pos]?.label ?? "---").padEnd(4)}${cut(p.name, 16).padEnd(17)}${p.rating.toFixed(1).padStart(4)} ${`${Math.round(p.seconds / 60)}'`.padStart(4)} ${ga}`.trimEnd();
    });
    fields.push({ name: `👥 Plantilla · ${ps.length} jugadores${ps.length < 11 ? " + IA" : ""}`, value: "```\n" + lines.join("\n") + "\n```" });
  }

  // Disciplina: rojas del juego + rojas del bot por abandono
  const discipline = [
    ...ps.filter((p) => p.redcards > 0).map((p) => `🟥 **${p.name}** · expulsado en el partido`),
    ...(opts.abandonos ?? []).map((x) => `🟥 <@${x.discordId}> (${x.gamertag}) · se fue a mitad de partido (${x.pct}% jugado)`),
  ];
  fields.push({ name: "⚖️ Disciplina", value: discipline.join("\n") || "✅ Sin tarjetas" });

  return {
    color: COLOR[result] ?? 0x1e6bff,
    author: { name: `${clubName} · ${TYPE_LABEL[type]}`, icon_url: opts.crestUrl },
    title: TITLE[result] ?? result,
    description: `## ${gf} - ${ga}  vs  ${opponent}\n${ts(playedAt, "F")}`,
    thumbnail: { url: opts.crestUrl },
    fields,
    footer: { text: `EA FC 27 Clubs · partido ${m.matchId}` },
    timestamp: playedAt.toISOString(),
  };
}
