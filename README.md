# Bot del club · Fase 1

Bot de Discord (por HTTP, sin servidor 24/7) + worker que lee la API pública de EA Clubs.

**Qué hace**
- `/convocatoria` → mensaje con botones Voy / Tal vez / No voy (solo admins).
- `/vincular gamertag` → une la cuenta de Discord con el gamertag de EA.
- `/fiabilidad [jugador]` → % de convocatorias cumplidas + tarjetas.
- `/tarjeta` → tarjeta manual del capitán (solo admins).
- Cada 15 min: publica resultados nuevos, saca 🟥 a los confirmados que jugaron menos del 75% del partido,
  cierra convocatorias (🟨 a quien confirmó y no jugó) y recuerda 1 h antes a quien no ha respondido.

## Setup (≈30 min)

### 1. Servidor de pruebas
Crea un servidor de Discord nuevo. En Discord: Ajustes > Avanzado > **Modo desarrollador**.
Clic derecho en el servidor → *Copiar ID* (`DISCORD_GUILD_ID`) y en el canal de pruebas → *Copiar ID* (`DISCORD_CHANNEL_ID`).

### 2. Aplicación de Discord
1. https://discord.com/developers/applications → **New Application**.
2. *General Information*: copia **Application ID** y **Public Key**.
3. *Bot* → **Reset Token** y copia el token (`DISCORD_BOT_TOKEN`).
4. *OAuth2 > URL Generator*: scopes `bot` + `applications.commands`; permisos `Send Messages`, `Embed Links`,
   `Read Message History`, `View Channels`. Abre la URL e invita el bot a tu servidor de pruebas.

### 3. Supabase
Crea un proyecto → *SQL Editor* → pega y ejecuta `supabase/schema.sql`.
En *Project Settings > API* copia la **URL** y la **service_role key**.

### 4. Local
```bash
cp .env.example .env      # rellena los valores
npm install
npm run test:ea           # comprueba que la API de EA responde y muestra los últimos partidos
npm run register          # registra los slash commands en el servidor de pruebas
```

### 5. Desplegar en Vercel
1. Sube el repo a GitHub e impórtalo en Vercel.
2. Copia todas las variables de `.env` en *Settings > Environment Variables*.
3. Ya desplegado, en el Developer Portal de Discord (*General Information*) pon
   **Interactions Endpoint URL** = `https://TU-APP.vercel.app/api/discord/interactions` y guarda
   (Discord hace un PING; si la Public Key está bien, lo acepta).

### 6. Cron cada 15 min (GitHub Actions)
EA (Akamai) bloquea las IP de Vercel con 403, así que el sync **no** corre en Vercel: lo ejecuta
directamente `.github/workflows/cron.yml` en los runners de GitHub, donde EA sí responde.
1. En GitHub > *Settings > Secrets and variables > Actions* crea los secrets
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DISCORD_BOT_TOKEN` y `DISCORD_CHANNEL_ID`.
2. Pestaña *Actions* > **sync-ea** > *Run workflow* con **dry** marcado: debe salir `"fetched"` > 0.
3. **Disparo cada 2 min** (el cron de GitHub no es fiable):
   - En Vercel añade `GITHUB_TOKEN` (token *fine-grained* solo de este repo, permiso **Actions: Read and write**).
   - En [cron-job.org](https://cron-job.org) crea un job: URL `https://TU-APP.vercel.app/api/cron/trigger`,
     cada 2 minutos. Autenticación: `?key=TU_TRIGGER_KEY` en la URL (clave de solo-disparo) o la cabecera
     `Authorization: Bearer TU_CRON_SECRET`.
   - El repo debe ser **público** para que los minutos de Actions sean gratis e ilimitados.

En local: `npm run sync -- --dry` (solo EA) o `npm run sync` (todo, con tu `.env`).

## Notas
- La API de EA no es oficial: puede cambiar o caerse sin aviso. El bot sigue funcionando con lo guardado.
- `secondsPlayed` no distingue "se fue en el min 45" de "entró en el min 45": por eso solo se sanciona
  a quien **confirmó** en la convocatoria. Ajusta el umbral con `LEAVER_THRESHOLD`.
- Jugadores con 0 segundos en un partido no reciben roja (estaban en la sala pero no jugaron).
- Sin `/vincular`, el bot no puede comprobar a un jugador y no lo sanciona.
