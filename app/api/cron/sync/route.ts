import { env } from "@/lib/env";
import { runSync } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Lo llama GitHub Actions cada 15 min.
 * GET /api/cron/sync           → sincroniza todo
 * GET /api/cron/sync?dry=1     → solo prueba que EA responde desde el hosting
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return new Response("No autorizado", { status: 401 });
  }
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const result = await runSync({ dry });
  return Response.json(result);
}
