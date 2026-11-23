import { env } from "./env";

const API = "https://discord.com/api/v10";

/** Publica un mensaje en un canal usando el token del bot (sin gateway). */
export async function postMessage(channelId: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${env.discordBotToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Discord ${res.status}: ${await res.text()}`);
  return res.json();
}

export const mention = (discordId: string) => `<@${discordId}>`;
export const ts = (date: Date, style: "F" | "R" | "t" | "f" = "F") =>
  `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;

/** Evita que los mensajes que editamos o publicamos hagan ping a todo el mundo. */
export const NO_PINGS = { parse: [] as string[] };
