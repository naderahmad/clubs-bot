import { env } from "./env";

const API = "https://discord.com/api/v10";

/** Publica un mensaje en un canal usando el token del bot (sin gateway). */
export interface DiscordFile {
  name: string;
  data: ArrayBuffer;
  contentType?: string;
}

/**
 * Publica un mensaje. Con `files`, los sube como adjuntos (multipart): el embed los usa con
 * `attachment://<name>`, así Discord no tiene que descargar nada de nuestra web.
 */
export async function postMessage(channelId: string, body: Record<string, unknown>, files: DiscordFile[] = []) {
  for (let attempt = 0; ; attempt++) {
    let init: RequestInit;
    if (files.length) {
      const form = new FormData();
      form.append(
        "payload_json",
        JSON.stringify({ ...body, attachments: files.map((f, i) => ({ id: i, filename: f.name })) }),
      );
      files.forEach((f, i) => form.append(`files[${i}]`, new Blob([f.data], { type: f.contentType ?? "image/png" }), f.name));
      init = { method: "POST", headers: { Authorization: `Bot ${env.discordBotToken}` }, body: form };
    } else {
      init = {
        method: "POST",
        headers: { Authorization: `Bot ${env.discordBotToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    }
    const res = await fetch(`${API}/channels/${channelId}/messages`, init);
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
