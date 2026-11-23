import { env } from "./env";

const API = "https://discord.com/api/v10";

/** Publica un mensaje en un canal usando el token del bot (sin gateway). */
export async function postMessage(channelId: string, body: Record<string, unknown>) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${env.discordBotToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // Rate limit (p. ej. al publicar varios partidos seguidos): esperar lo que pide Discord y reintentar.
    if (res.status === 429 && attempt < 5) {
      const { retry_after = 1 } = (await res.json().catch(() => ({}))) as { retry_after?: number };
      await new Promise((r) => setTimeout(r, Math.ceil(retry_after * 1000) + 100));
      continue;
    }
    if (!res.ok) throw new Error(`Discord ${res.status}: ${await res.text()}`);
    return res.json();
  }
}

export const mention = (discordId: string) => `<@${discordId}>`;
export const ts = (date: Date, style: "F" | "R" | "t" | "f" = "F") =>
  `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;

/** Evita que los mensajes que editamos o publicamos hagan ping a todo el mundo. */
export const NO_PINGS = { parse: [] as string[] };
