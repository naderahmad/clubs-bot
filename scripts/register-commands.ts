/**
 * Registra los slash commands en el servidor de pruebas (DISCORD_GUILD_ID).
 * Los comandos de servidor se actualizan al instante; ejecuta esto cada vez que cambies lib/commands.ts.
 *   npm run register
 */
import "dotenv/config";
import { COMMANDS } from "../lib/commands";

const appId = process.env.DISCORD_APP_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const token = process.env.DISCORD_BOT_TOKEN;
if (!appId || !guildId || !token) throw new Error("Faltan DISCORD_APP_ID, DISCORD_GUILD_ID o DISCORD_BOT_TOKEN en .env");

const res = await fetch(`https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`, {
  method: "PUT",
  headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(COMMANDS),
});

if (!res.ok) {
  console.error(`❌ Error ${res.status}:`, await res.text());
  process.exit(1);
}
const data = (await res.json()) as Array<{ name: string }>;
console.log(`✅ Registrados ${data.length} comandos: ${data.map((c) => "/" + c.name).join(", ")}`);
