/**
 * Sync de EA → Supabase → Discord, ejecutado fuera de Vercel
 * (Akamai bloquea las IP de Vercel con 403; desde GitHub Actions sí responde).
 *   npm run sync          → sincroniza todo
 *   npm run sync -- --dry → solo comprueba que EA responde (no toca Supabase ni Discord)
 * Lo lanza .github/workflows/cron.yml cada 15 min.
 */
import "dotenv/config";
import { runSync } from "../lib/sync";

const dry = process.argv.includes("--dry");
const result = await runSync({ dry });
console.log(JSON.stringify(result, null, 2));

for (const e of result.errors) console.log(`::warning::${e}`);
if (result.errors.length) process.exit(1);
