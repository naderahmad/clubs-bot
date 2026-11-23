function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

export const env = {
  get discordAppId() { return required("DISCORD_APP_ID"); },
  get discordPublicKey() { return required("DISCORD_PUBLIC_KEY"); },
  get discordBotToken() { return required("DISCORD_BOT_TOKEN"); },
  get discordGuildId() { return required("DISCORD_GUILD_ID"); },
  get discordChannelId() { return required("DISCORD_CHANNEL_ID"); },
  get supabaseUrl() { return required("SUPABASE_URL"); },
  get supabaseKey() { return required("SUPABASE_SERVICE_ROLE_KEY"); },
  get eaClubId() { return required("EA_CLUB_ID"); },
  get eaClubName() { return process.env.EA_CLUB_NAME || "STARLINK FCX"; },
  get eaPlatform() { return process.env.EA_PLATFORM || "common-gen5"; },
  get utcOffset() { return process.env.CLUB_UTC_OFFSET || "-04:00"; },
  get leaverThreshold() { return Number(process.env.LEAVER_THRESHOLD || 0.75); },
  get sessionWindowHours() { return Number(process.env.SESSION_WINDOW_HOURS || 4); },
  /** URL pública de la web (para el escudo en los mensajes). */
  get appUrl() { return (process.env.APP_URL || "https://clubs-bot.vercel.app").replace(/\/$/, ""); },
  get crestUrl() { return `${this.appUrl}/escudo.jpg`; },
  get cronSecret() { return required("CRON_SECRET"); },
};
