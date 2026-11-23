import { db } from "./supabase";
import { mention, ts, NO_PINGS } from "./discord";

export type RsvpStatus = "voy" | "no" | "quizas";

export interface Session {
  id: number;
  match_type: "liga" | "amistoso";
  starts_at: string;
  note: string | null;
}

/** Arma el mensaje de la convocatoria (contenido + botones) con las respuestas actuales. */
export async function renderSession(session: Session, closed = false) {
  const { data: rsvps } = await db()
    .from("rsvps")
    .select("discord_id, status, updated_at")
    .eq("session_id", session.id)
    .order("updated_at", { ascending: true });

  const by = (s: RsvpStatus) => (rsvps ?? []).filter((r) => r.status === s).map((r) => mention(r.discord_id));
  const voy = by("voy"), no = by("no"), quizas = by("quizas");
  const start = new Date(session.starts_at);
  const tipo = session.match_type === "liga" ? "Liga" : "Amistoso";

  const lines = [
    `## 📣 Convocatoria · ${tipo}`,
    `🗓️ ${ts(start, "F")} (${ts(start, "R")})`,
    session.note ? `📝 ${session.note}` : null,
    "",
    `✅ **Van (${voy.length}):** ${voy.join(", ") || "—"}`,
    `🤔 **Tal vez (${quizas.length}):** ${quizas.join(", ") || "—"}`,
    `❌ **No van (${no.length}):** ${no.join(", ") || "—"}`,
    closed ? "\n🔒 Convocatoria cerrada" : null,
  ].filter((l) => l !== null);

  const button = (status: RsvpStatus, label: string, style: number) => ({
    type: 2, style, label, custom_id: `rsvp:${session.id}:${status}`, disabled: closed,
  });

  return {
    content: lines.join("\n"),
    components: [{
      type: 1,
      components: [button("voy", "Voy", 3), button("quizas", "Tal vez", 2), button("no", "No voy", 4)],
    }],
    allowed_mentions: NO_PINGS,
  };
}

/** Fiabilidad = convocatorias confirmadas y cumplidas / convocatorias confirmadas (ya cerradas). */
export async function getReliability(discordId: string) {
  const { data: confirmed } = await db()
    .from("rsvps")
    .select("session_id, sessions!inner(closed)")
    .eq("discord_id", discordId)
    .eq("status", "voy")
    .eq("sessions.closed", true);

  const { data: cards } = await db()
    .from("cards")
    .select("type, reason, session_id, created_at")
    .eq("discord_id", discordId)
    .order("created_at", { ascending: false });

  const confirmedIds = new Set((confirmed ?? []).map((r) => r.session_id as number));
  const failed = new Set(
    (cards ?? []).filter((c) => c.session_id && confirmedIds.has(c.session_id)).map((c) => c.session_id),
  );
  const total = confirmedIds.size;
  const pct = total === 0 ? null : Math.round(((total - failed.size) / total) * 100);

  return {
    pct,
    total,
    amarillas: (cards ?? []).filter((c) => c.type === "amarilla").length,
    rojas: (cards ?? []).filter((c) => c.type === "roja").length,
    recent: (cards ?? []).slice(0, 5),
  };
}
