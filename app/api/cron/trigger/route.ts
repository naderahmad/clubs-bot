import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lo llama cron-job.org cada 2 min. Lanza el workflow `sync-ea` en GitHub Actions
 * (EA bloquea a Vercel, así que el sync no puede correr aquí). Los workflow_dispatch
 * arrancan al momento, a diferencia del cron programado de GitHub.
 * GET/POST /api/cron/trigger  con  Authorization: Bearer <CRON_SECRET>
 *       o   /api/cron/trigger?key=<TRIGGER_KEY>   (clave de solo-disparo, cómoda para pegar en cron-job.org;
 *                                                 si se filtra, lo único que permite es lanzar un sync)
 */
async function trigger(req: Request) {
  const triggerKey = process.env.TRIGGER_KEY;
  const byHeader = req.headers.get("authorization") === `Bearer ${env.cronSecret}`;
  const byKey = !!triggerKey && new URL(req.url).searchParams.get("key") === triggerKey;
  if (!byHeader && !byKey) return new Response("No autorizado", { status: 401 });
  const repo = process.env.GITHUB_REPO || "naderahmad/clubs-bot";
  const token = process.env.GITHUB_TOKEN;
  if (!token) return new Response("Falta GITHUB_TOKEN", { status: 500 });

  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/cron.yml/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "clubs-bot",
    },
    body: JSON.stringify({ ref: "main" }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return new Response(`GitHub ${res.status}: ${await res.text()}`, { status: 502 });
  return Response.json({ ok: true });
}

export const GET = trigger;
export const POST = trigger;
