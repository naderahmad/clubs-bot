/**
 * Resumen de partido para Discord: embed corto + imagen horizontal con las cartas
 * de los jugadores (la genera /api/match/<id>/image en Vercel, ver lib/match-card.tsx).
 */
import type { EaMatch, EaMatchType } from "./ea";
import { env } from "./env";
import { postMessage, ts, NO_PINGS } from "./discord";
import { matchView, TYPE_LABEL } from "./match-data";
import { clubById } from "./clubs";
import { matchInsights } from "./match-insights";

export interface Abandono {
  discordId: string;
  gamertag: string;
  pct: number;
}

/** Súbelo si cambia el diseño de la imagen (Discord y la CDN la cachean por URL). */
const IMAGE_VERSION = 5;

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

export const matchImageUrl = (appUrl: string, matchId: string) =>
  `${appUrl}/api/match/${matchId}/image?v=${IMAGE_VERSION}`;

export function buildMatchEmbed(
  m: EaMatch,
  type: EaMatchType,
  clubId: string,
  opts: { appUrl: string; abandonos?: Abandono[] },
) {
  const v = matchView(m, type, clubId);
  const mvp = v.mvp ? `⭐ **${v.mvp.name}** (${v.mvp.rating.toFixed(1)})` : "";

  // Disciplina: rojas del juego + rojas del bot por abandono (las menciones solo funcionan en texto)
  const discipline = [
    ...v.players.filter((p) => p.redcards > 0).map((p) => `🟥 **${p.name}** · expulsado en el partido`),
    ...(opts.abandonos ?? []).map((x) => `🟥 <@${x.discordId}> (${x.gamertag}) · se fue a mitad de partido (${x.pct}% jugado)`),
  ];
  const keys = matchInsights(v).map((i) => (i.tone === "good" ? `✅ ${i.title}` : `⚠️ ${i.title} → ${i.tip}`));

  return {
    color: COLOR[v.result] ?? 0x1e6bff,
    author: { name: `${v.clubName} · ${TYPE_LABEL[type]}`, icon_url: `${opts.appUrl}${clubById(clubId).embedIcon}` },
    title: `${TITLE[v.result] ?? v.result}  ${v.goalsFor} - ${v.goalsAgainst}  vs ${v.opponent}`,
    description: [ts(v.playedAt, "F"), mvp].filter(Boolean).join(" · "),
    fields: [
      ...(keys.length ? [{ name: "📋 Claves del partido", value: keys.join("\n") }] : []),
      ...(discipline.length ? [{ name: "⚖️ Disciplina", value: discipline.join("\n") }] : []),
    ],
    image: { url: matchImageUrl(opts.appUrl, v.matchId) },
    footer: { text: `EA FC 27 Clubs · partido ${v.matchId}` },
    timestamp: v.playedAt.toISOString(),
  };
}

/**
 * Descarga la imagen del partido (la genera Vercel: ~13 s en frío) esperando lo necesario, hasta 3 intentos.
 * No se puede dejar que Discord la pida por URL: la caché de Vercel es por región, Discord suele pedirla
 * desde otra donde aún no existe y no espera más de ~10 s → el mensaje salía sin imagen.
 */
export async function fetchMatchImage(url: string): Promise<ArrayBuffer | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
      if (res.ok && res.headers.get("content-type")?.startsWith("image/")) return await res.arrayBuffer();
      console.log(`imagen intento ${attempt}: HTTP ${res.status}`);
    } catch (err) {
      console.log(`imagen intento ${attempt}: ${String(err)}`);
    }
    await new Promise((r) => setTimeout(r, 3000 * attempt));
  }
  return null;
}

/** Publica el resumen con la imagen ADJUNTA al mensaje. Si no se pudo generar, sale sin ella y avisa en el log. */
export async function postMatchEmbed(embed: ReturnType<typeof buildMatchEmbed>, matchId: string, channelId = env.discordChannelId) {
  const png = await fetchMatchImage(embed.image.url);
  if (!png) {
    console.log(`::warning::La imagen del partido ${matchId} no se pudo generar; se publica sin imagen`);
    return postMessage(channelId, { embeds: [{ ...embed, image: undefined }], allowed_mentions: NO_PINGS });
  }
  const name = `partido-${matchId}.png`;
  return postMessage(
    channelId,
    { embeds: [{ ...embed, image: { url: `attachment://${name}` } }], allowed_mentions: NO_PINGS },
    [{ name, data: png }],
  );
}
