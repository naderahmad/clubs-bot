# Bot del club STARLINK FCX · contexto del proyecto

## Qué es
Herramienta para formalizar un equipo de Clubs (antes Pro Clubs) de EA FC 27 de unos amigos de Samer.
Uno de ellos hace stream y tiene una comunidad pequeña. Problema a resolver: jugadores que se van a
mitad de partido o que confirman y no juegan.

- Club: **STARLINK FCX**, PS5 (crossplay), `clubId` **621507**, plataforma `common-gen5`.
- Referencia visual para la web (fase 2): https://myproclubs.com/STARLINK%20FCX/621507-5
  (encabezado con escudo + skill rating, líderes del club, historial V/E/D, plantilla por posición con rating).
  No tiene asistencia ni disciplina: esa es nuestra diferencia.
- Idioma de la UI y de los mensajes del bot: español (Venezuela). Zona horaria del club: UTC-04:00.
- Samer trabaja iterativo: borrador → revisión → final. Comunicación directa y concisa en español.

## Decisiones tomadas
- **Mixto**: bot de Discord para el día a día (convocatorias, recordatorios, resultados, tarjetas) +
  web app para consulta y gestión (perfiles, rankings, historial, panel del capitán, página pública, overlay).
- **Un solo backend**: Supabase es la fuente de verdad. Bot y web solo leen/escriben ahí.
- **Bot por HTTP** (Discord Interactions Endpoint) dentro de Next.js en Vercel, sin gateway 24/7.
- **Worker** en GitHub Actions (`.github/workflows/cron.yml`, cada 15 min) ejecutando `scripts/sync.ts` directamente.
  Verificado 2026-11-22: EA/Akamai devuelve **403 desde Vercel**, pero responde desde PC local y desde runners de GitHub.
  `/api/cron/sync` sigue en Vercel solo como diagnóstico (no se usa en producción).
- Login de la web (fase 2): Discord OAuth vía Supabase Auth.
- Se prueba primero en un **servidor de Discord de pruebas**, no en el principal.

## Fases
1. **(actual)** Bot + DB: `/convocatoria`, `/vincular`, `/fiabilidad`, `/tarjeta`, resultados automáticos,
   rojas por abandono, amarillas por ausencia, recordatorio 1 h antes.
2. Web: perfiles tipo cromo, rankings, historial, panel del capitán, votación MVP.
3. Comunidad: página pública del club, formulario de pruebas (banco de reservas), overlay OBS, API de Twitch.

## API de EA (no oficial)
Base `https://proclubs.ea.com/api/fc/`, GET sin auth. Verificado funcionando con FC 27 el 2026-11-22.
- `allTimeLeaderboard/search?platform=&clubName=` → buscar club.
- `clubs/info?clubIds=`, `clubs/overallStats?clubIds=`.
- `members/stats?clubId=` (temporada) y `members/career/stats?clubId=` → solo trae `name`, no playerId.
- `clubs/matches?clubIds=&matchType=leagueMatch|friendlyMatch|playoffMatch&maxResultCount=10`
  - **Máximo 10 partidos, sin paginación** → hay que consultar seguido y guardar.
  - `players[clubId][playerId]` trae `playername`, `pos`, `rating`, `goals`, `assists`, `mom`, `secondsPlayed`, etc.
  - Resultado liga: `1` victoria, `2` derrota, `4` empate, `16385` victoria por abandono rival, `10` derrota por abandono.
  - Amistosos: `result` = `"0"`, se deduce por goles.
- Casi todos los valores vienen como strings.
- Akamai bloquea clientes que no parecen navegador (403 o timeout); `curl` simple bloqueado. Usar headers tipo Chrome (ver `lib/ea.ts`).
- Los IDs de club cambian cada juego anual. Identificar jugadores por `playerId` (estable), no por gamertag.
- Librerías de referencia: `proclubs-sdk` (Node/TS), `1erkandogan/fc27-clubs-api` (Python, mejor doc de campos),
  `eltrueno/TruenoProClubServices` (proyecto completo en español con detectDnf).

## Detección de abandonos (validado con partidos reales de STARLINK FCX)
- Partido completo ≈ 5.500 `secondsPlayed` (amistosos con prórroga ≈ 7.200). Se compara contra el máximo del partido.
- **Roja** si un jugador **confirmado** juega > 0 y < `LEAVER_THRESHOLD` (0.75) del máximo.
  Se bajó de 0.85 a 0.75 porque se vio un jugador en 84% que no parecía abandono.
- 0 segundos = estaba en la sala pero no jugó → no es roja.
- `secondsPlayed` no distingue "se fue" de "entró tarde" → solo se sanciona a quien confirmó.
- **Amarilla** al cerrar la convocatoria (inicio + 4 h) a confirmados vinculados sin ninguna aparición > 0 s.
- Muchos partidos de liga tienen solo ~5 humanos (el resto IA).

## Estado actual
- Fase 1 desplegada y conectada a Discord/Supabase reales. Falta probar los comandos a mano en Discord.
- Desplegado: https://clubs-bot.vercel.app (repo privado `naderahmad/clubs-bot`, push a `main` despliega).
- Supabase: proyecto `clubs-bot` (ref `wkkmhdcmlmliwrcurywj`, us-east-1), schema aplicado; claves en `.env`, Vercel y secrets de GitHub.
- Discord: app "Starlink" en el servidor de pruebas, endpoint configurado, 4 comandos registrados.
- Workflow `sync-ea` activo cada 15 min; primer sync real 2026-11-22 guardó 14 partidos.
- Ideas para después: suspensión automática tras roja, check-in por canal de voz (requiere gateway),
  quitar tarjetas, MVP votado.

## Estructura
- `app/api/discord/interactions/route.ts` → comandos y botones (verifica firma Ed25519).
- `scripts/sync.ts` → sync que corre en GitHub Actions (`--dry` = solo EA).
- `app/api/cron/sync/route.ts` → sync vía HTTP protegido con `CRON_SECRET` (solo diagnóstico: EA bloquea Vercel).
- `lib/sync.ts` → guardar partidos, rojas, cerrar convocatorias, recordatorios.
- `lib/match-embed.ts` → resumen de cada partido nuevo: embed corto (resultado, marcador, MVP, disciplina con menciones)
  + imagen horizontal `app/api/match/[id]/image` (next/og, `lib/match-card.tsx`): cartas tipo FUT por jugador
  (MVP dorada, 0' atenuada) y comparativa de equipos. Datos comunes en `lib/match-data.ts`. Si cambias el diseño,
  sube `IMAGE_VERSION` (Discord cachea por URL). EA **no** trae faltas ni amarillas del juego: solo `redcards`.
- `public/fonts/` (Barlow Condensed, OFL, para la imagen), `public/escudo.jpg` (icono de los embeds vía `APP_URL`), `public/escudo-cuadrado.png` (avatar), `app/icon.png` (favicon).
- `lib/ea.ts`, `lib/discord.ts`, `lib/convocatoria.ts`, `lib/commands.ts`, `lib/time.ts`.
- `supabase/schema.sql`, `scripts/register-commands.ts`, `scripts/test-ea.ts`, `.github/workflows/cron.yml`.

## Comandos
`npm run dev` · `npm run build` · `npm run typecheck` · `npm run test:ea` · `npm run sync` (`-- --dry`) · `npm run preview:match` (`-- <matchId>`) · `npm run register`
