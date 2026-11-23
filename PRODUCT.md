# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Principal: la gente del stream.** Espectadores de la comunidad pequeña del streamer del club que quieren encontrar
  el club dentro de EA FC 27 y unirse al Discord. Llegan desde un enlace del stream o del chat, casi siempre en el móvil.
- Secundario: los jugadores del club, que usan el bot de Discord a diario (convocatorias, tarjetas, resúmenes de partido).

## Product Purpose

Formalizar el equipo de Clubs (antes Pro Clubs) **STARLINK FCX** de EA FC 27: un bot de Discord para el día a día
(convocatorias, recordatorios, resultados automáticos, rojas por abandono, amarillas por ausencia) y una web para consulta.
El problema que resuelve: jugadores que se van a mitad de partido o que confirman y no juegan.
Éxito de la página pública: que alguien del stream encuentre el club en el juego sin equivocarse de nombre y entre al Discord.

## Positioning

Los datos vienen de los partidos reales del club (API de EA, guardados en Supabase cada 2 min) y el club lleva control de
asistencia y disciplina, algo que las webs genéricas de estadísticas (p. ej. myproclubs.com) no tienen.

## Operating Context

- Club en EA FC 27, PS5 con crossplay, `clubId` 621507, plataforma `common-gen5`. Muchos partidos de liga con ~5 humanos.
- Discord oficial: servidor "STARLINK FCX / TITANS CR1OLLO", invitación permanente https://discord.gg/Bc3BVhmJC2
  (157 miembros el 2026-11-23). Los resúmenes de partido se publican en #📪│historial.
- Zona horaria del club UTC-04:00 (Venezuela).

## Capabilities and Constraints

- Next.js en Vercel; Supabase es la fuente de verdad. Vercel no puede llamar a la API de EA (403 de Akamai): la web solo
  lee lo que el sync de GitHub Actions guardó (tablas `matches`, `match_players`).
- EA no da caras de los Pro; el escudo del club en el juego es un escudo genérico de EA. El logo propio está en `public/`.
- **Pendiente:** enlace del stream (plataforma y URL no confirmadas).

## Brand Commitments

- Nombre exacto: **STARLINK FCX** (mayúsculas, con espacio).
- Logo propio del club (escudo con corona, estrella y balón): `public/escudo.jpg`, `public/escudo-cuadrado.png`.
- Colores del club: azules del logo sobre fondo muy oscuro, con blanco/plata.
- Idioma: español de Venezuela, directo y conciso.

## Evidence on Hand

- Partidos reales guardados desde el 2026-11-20 (resultados, goles, asistencias, rating, MVP por jugador).
- Recuento real de miembros del Discord vía la API de invitaciones.
- No hay testimonios, palmarés ni patrocinadores: no inventarlos.

## Product Principles

1. El nombre exacto del club y la forma de entrar al Discord se encuentran en segundos, sin buscar.
2. Todo lo que se muestra sale de partidos reales; nada inventado.
3. Primero el móvil: la gente llega desde el stream.
4. La identidad es la del club (su escudo y sus azules), no la de EA ni la de una web de estadísticas.
