import { verifyKey } from "discord-interactions";
import { env } from "@/lib/env";
import { db } from "@/lib/supabase";
import { mention, NO_PINGS } from "@/lib/discord";
import { parseLocalDateTime } from "@/lib/time";
import { renderSession, getReliability, type RsvpStatus, type Session } from "@/lib/convocatoria";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tipos de Discord
const PING = 1, APPLICATION_COMMAND = 2, MESSAGE_COMPONENT = 3;
const PONG = 1, CHANNEL_MESSAGE = 4, UPDATE_MESSAGE = 7;
const EPHEMERAL = 64;

const reply = (content: string, ephemeral = true) =>
  Response.json({ type: CHANNEL_MESSAGE, data: { content, flags: ephemeral ? EPHEMERAL : 0, allowed_mentions: NO_PINGS } });

type Option = { name: string; value: string };

export async function POST(req: Request) {
  // 1. Verificar firma (Discord rechaza el endpoint si esto no funciona)
  const body = await req.text();
  const signature = req.headers.get("x-signature-ed25519") ?? "";
  const timestamp = req.headers.get("x-signature-timestamp") ?? "";
  const valid = await verifyKey(body, signature, timestamp, env.discordPublicKey);
  if (!valid) return new Response("Firma inválida", { status: 401 });

  const interaction = JSON.parse(body);
  if (interaction.type === PING) return Response.json({ type: PONG });

  const user = interaction.member?.user ?? interaction.user;
  const discordId: string = user.id;
  const discordName: string = user.global_name ?? user.username;

  try {
    if (interaction.type === APPLICATION_COMMAND) {
      const name: string = interaction.data.name;
      const opts: Record<string, string> = Object.fromEntries(
        ((interaction.data.options ?? []) as Option[]).map((o) => [o.name, o.value]),
      );

      if (name === "convocatoria") return await handleConvocatoria(interaction, opts, discordId);
      if (name === "vincular") return await handleVincular(opts, discordId, discordName);
      if (name === "fiabilidad") return await handleFiabilidad(opts.jugador ?? discordId);
      if (name === "tarjeta") return await handleTarjeta(opts, discordId);
      return reply("Comando no reconocido.");
    }

    if (interaction.type === MESSAGE_COMPONENT) {
      const [kind, sessionId, status] = String(interaction.data.custom_id).split(":");
      if (kind === "rsvp") return await handleRsvp(Number(sessionId), status as RsvpStatus, discordId, discordName);
    }
  } catch (e) {
    console.error(e);
    return reply("⚠️ Algo falló. Inténtalo de nuevo en un momento.");
  }

  return reply("Interacción no soportada.");
}

async function handleConvocatoria(interaction: any, opts: Record<string, string>, discordId: string) {
  const startsAt = parseLocalDateTime(opts.fecha, opts.hora, env.utcOffset);
  if (!startsAt) return reply("Fecha u hora inválida. Usa `AAAA-MM-DD` (o `hoy`/`mañana`) y `HH:MM`.");
  if (startsAt.getTime() < Date.now()) return reply("Esa fecha ya pasó.");

  const { data: session, error } = await db()
    .from("sessions")
    .insert({
      guild_id: interaction.guild_id,
      channel_id: interaction.channel_id,
      match_type: opts.tipo,
      starts_at: startsAt.toISOString(),
      note: opts.nota ?? null,
      created_by: discordId,
    })
    .select()
    .single();
  if (error) throw error;

  return Response.json({ type: CHANNEL_MESSAGE, data: await renderSession(session as Session) });
}

async function handleRsvp(sessionId: number, status: RsvpStatus, discordId: string, discordName: string) {
  const { data: session } = await db().from("sessions").select().eq("id", sessionId).single();
  if (!session) return reply("Esta convocatoria ya no existe.");
  // Se puede responder hasta 15 min después de la hora de inicio
  if (session.closed || new Date(session.starts_at).getTime() + 15 * 60_000 < Date.now()) {
    return reply("🔒 Esta convocatoria ya está cerrada.");
  }

  await db().from("players").upsert({ discord_id: discordId, discord_name: discordName }, { onConflict: "discord_id" });
  const { error } = await db()
    .from("rsvps")
    .upsert({ session_id: sessionId, discord_id: discordId, status, updated_at: new Date().toISOString() });
  if (error) throw error;

  return Response.json({ type: UPDATE_MESSAGE, data: await renderSession(session as Session) });
}

async function handleVincular(opts: Record<string, string>, discordId: string, discordName: string) {
  const gamertag = opts.gamertag.trim();
  const { error } = await db()
    .from("players")
    .upsert({ discord_id: discordId, discord_name: discordName, gamertag }, { onConflict: "discord_id" });
  if (error) throw error;
  return reply(`✅ Vinculado como **${gamertag}**. Se confirmará solo cuando aparezcas en un partido del club.`);
}

async function handleFiabilidad(targetId: string) {
  const r = await getReliability(targetId);
  const pct = r.pct === null ? "sin datos todavía" : `**${r.pct}%** (${r.total} convocatorias confirmadas)`;
  const recent = r.recent.length
    ? r.recent.map((c) => `${c.type === "roja" ? "🟥" : "🟨"} ${c.reason ?? ""}`).join("\n")
    : "Sin tarjetas 👏";
  return reply(`📊 Fiabilidad de ${mention(targetId)}: ${pct}\n🟨 ${r.amarillas} · 🟥 ${r.rojas}\n\n${recent}`, false);
}

async function handleTarjeta(opts: Record<string, string>, captainId: string) {
  const { error } = await db().from("cards").insert({
    discord_id: opts.jugador,
    type: opts.tipo,
    reason: opts.motivo,
    auto: false,
    created_by: captainId,
  });
  if (error) throw error;
  const icon = opts.tipo === "roja" ? "🟥" : "🟨";
  return reply(`${icon} Tarjeta ${opts.tipo} para ${mention(opts.jugador)} — ${opts.motivo}`, false);
}
