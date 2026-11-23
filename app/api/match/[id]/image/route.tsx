import { ImageResponse } from "next/og";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { matchView } from "@/lib/match-data";
import { MatchCard, CARD_WIDTH, cardLayout } from "@/lib/match-card";
import type { EaMatch, EaMatchType } from "@/lib/ea";

export const runtime = "nodejs";

/** PNG horizontal del partido para el embed de Discord: /api/match/<matchId>/image */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("ID inválido", { status: 400 });

  const { data, error } = await db().from("matches").select("match_type, raw").eq("match_id", id).maybeSingle();
  if (error) return new Response("Error de base de datos", { status: 500 });
  if (!data) return new Response("Partido no encontrado", { status: 404 });

  const v = matchView(data.raw as EaMatch, data.match_type as EaMatchType, env.eaClubId);
  const origin = new URL(req.url).origin;
  const [w600, w800] = await Promise.all(
    [600, 800].map((w) => fetch(`${origin}/fonts/barlow-condensed-${w}.woff`).then((r) => r.arrayBuffer())),
  );

  return new ImageResponse(<MatchCard v={v} crestUrl={`${origin}/escudo-cuadrado.png`} utcOffset={env.utcOffset} />, {
    width: CARD_WIDTH,
    height: cardLayout(v.players.length).height,
    fonts: [
      { name: "Barlow Condensed", data: w600, weight: 600, style: "normal" },
      { name: "Barlow Condensed", data: w800, weight: 800, style: "normal" },
    ],
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
  });
}
