import { ImageResponse } from "next/og";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { matchView } from "@/lib/match-data";
import { MatchCard, CARD_WIDTH, cardLayout, type CardExtras } from "@/lib/match-card";
import type { EaMatch, EaMatchType } from "@/lib/ea";

export const runtime = "nodejs";

/** Escudos de club que EA usa en la web (los mismos que myproclubs). */
const EA_CREST = (assetId: string) =>
  `https://eafc24.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l${assetId}.png`;

async function asDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${res.headers.get("content-type")};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Avatares de Discord de los jugadores vinculados y rojas del bot por abandono en este partido. */
async function extrasFor(matchId: string, eaIds: string[]) {
  const { data: linked } = await db().from("players").select("discord_id, ea_player_id").in("ea_player_id", eaIds);
  const eaByDiscord = new Map((linked ?? []).map((p) => [String(p.discord_id), String(p.ea_player_id)]));

  const { data: reds } = await db().from("cards").select("discord_id").eq("match_id", matchId).eq("type", "roja");
  const abandonos = (reds ?? []).map((c) => eaByDiscord.get(String(c.discord_id))).filter((x): x is string => !!x);

  const avatars: Record<string, string> = {};
  await Promise.all(
    [...eaByDiscord].map(async ([discordId, eaId]) => {
      try {
        const res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
          headers: { Authorization: `Bot ${env.discordBotToken}` },
          signal: AbortSignal.timeout(4000),
        });
        const u = (await res.json()) as { avatar?: string | null };
        if (res.ok && u.avatar) avatars[eaId] = `https://cdn.discordapp.com/avatars/${discordId}/${u.avatar}.png?size=128`;
      } catch {
        /* sin avatar: se dibuja la silueta */
      }
    }),
  );
  return { avatars, abandonos };
}

/** PNG horizontal del partido para el embed de Discord: /api/match/<matchId>/image */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("ID inválido", { status: 400 });

  const { data, error } = await db().from("matches").select("match_type, raw").eq("match_id", id).maybeSingle();
  if (error) return new Response("Error de base de datos", { status: 500 });
  if (!data) return new Response("Partido no encontrado", { status: 404 });

  const raw = data.raw as EaMatch;
  const v = matchView(raw, data.match_type as EaMatchType, env.eaClubId);
  const url = new URL(req.url);
  const origin = url.origin;
  const oppId = Object.keys(raw.clubs).find((k) => k !== env.eaClubId);
  const oppCrestId = oppId ? (raw.clubs[oppId]?.details as { customKit?: { crestAssetId?: string } } | undefined)?.customKit?.crestAssetId : undefined;

  const [w600, w800, opponentCrest, extra] = await Promise.all([
    fetch(`${origin}/fonts/barlow-condensed-600.woff`).then((r) => r.arrayBuffer()),
    fetch(`${origin}/fonts/barlow-condensed-800.woff`).then((r) => r.arrayBuffer()),
    oppCrestId ? asDataUrl(EA_CREST(oppCrestId)) : Promise.resolve(null),
    extrasFor(id, v.players.map((p) => p.eaPlayerId)),
  ]);

  // Solo en local: ?abandono=<eaPlayerId> para ver cómo queda una roja por abandono.
  if (process.env.NODE_ENV !== "production") extra.abandonos.push(...url.searchParams.getAll("abandono"));

  const extras: CardExtras = { ...extra, opponentCrest };
  return new ImageResponse(
    <MatchCard v={v} crestUrl={`${origin}/escudo-cuadrado.png`} utcOffset={env.utcOffset} threshold={env.leaverThreshold} extras={extras} />,
    {
      width: CARD_WIDTH,
      height: cardLayout(v.players.length).height,
      fonts: [
        { name: "Barlow Condensed", data: w600, weight: 600, style: "normal" },
        { name: "Barlow Condensed", data: w800, weight: 800, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
    },
  );
}
