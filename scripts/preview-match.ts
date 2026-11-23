/**
 * Publica en el canal el resumen de un partido ya guardado (para ver cómo queda el embed).
 *   npm run preview:match              → último partido
 *   npm run preview:match -- <matchId> → uno concreto
 * No saca tarjetas ni toca la base de datos.
 */
import "dotenv/config";
import { db } from "../lib/supabase";
import { env } from "../lib/env";
import { postMessage, NO_PINGS } from "../lib/discord";
import { buildMatchEmbed } from "../lib/match-embed";
import type { EaMatch, EaMatchType } from "../lib/ea";

const id = process.argv[2];
let q = db().from("matches").select("match_id, match_type, raw");
q = id ? q.eq("match_id", id) : q.order("played_at", { ascending: false });
const { data, error } = await q.limit(1);
if (error || !data?.length) throw error ?? new Error("Partido no encontrado");

const row = data[0];
const embed = buildMatchEmbed(row.raw as EaMatch, row.match_type as EaMatchType, env.eaClubId, { appUrl: env.appUrl, crestUrl: env.crestUrl });
await fetch(embed.image.url).catch(() => {});
await postMessage(env.discordChannelId, { embeds: [embed], allowed_mentions: NO_PINGS });
console.log(`✅ Publicado el resumen del partido ${row.match_id}`);
