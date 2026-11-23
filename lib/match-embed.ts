/**
 * Resumen de partido para Discord: embed corto + imagen horizontal con las cartas
 * de los jugadores (la genera /api/match/<id>/image en Vercel, ver lib/match-card.tsx).
 */
import type { EaMatch, EaMatchType } from "./ea";
import { ts } from "./discord";
import { matchView, TYPE_LABEL } from "./match-data";

export interface Abandono {
  discordId: string;
  gamertag: string;
  pct: number;
}

/** Súbelo si cambia el diseño de la imagen (Discord y la CDN la cachean por URL). */
const IMAGE_VERSION = 2;

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
  opts: { appUrl: string; crestUrl: string; abandonos?: Abandono[] },
) {
  const v = matchView(m, type, clubId);
  const mvp = v.mvp ? `⭐ **${v.mvp.name}** (${v.mvp.rating.toFixed(1)})` : "";

  // Disciplina: rojas del juego + rojas del bot por abandono (las menciones solo funcionan en texto)
  const discipline = [
    ...v.players.filter((p) => p.redcards > 0).map((p) => `🟥 **${p.name}** · expulsado en el partido`),
    ...(opts.abandonos ?? []).map((x) => `🟥 <@${x.discordId}> (${x.gamertag}) · se fue a mitad de partido (${x.pct}% jugado)`),
  ];

  return {
    color: COLOR[v.result] ?? 0x1e6bff,
    author: { name: `${v.clubName} · ${TYPE_LABEL[type]}`, icon_url: opts.crestUrl },
    title: `${TITLE[v.result] ?? v.result}  ${v.goalsFor} - ${v.goalsAgainst}  vs ${v.opponent}`,
    description: [ts(v.playedAt, "F"), mvp].filter(Boolean).join(" · "),
    fields: discipline.length ? [{ name: "⚖️ Disciplina", value: discipline.join("\n") }] : [],
    image: { url: matchImageUrl(opts.appUrl, v.matchId) },
    footer: { text: `EA FC 27 Clubs · partido ${v.matchId}` },
    timestamp: v.playedAt.toISOString(),
  };
}
