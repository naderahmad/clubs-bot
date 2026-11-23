---
name: STARLINK FCX
description: Página pública del club de EA FC 27. Campo nocturno, luz cian en las rutas, nombre exacto y Discord.
colors:
  night: "#03060c"
  deep-navy: "#071334"
  club-fog: "#173679"
  lume-cyan: "#38e0e0"
  mvp-violet: "#b48cff"
  loss-coral: "#ff8a8a"
  ink: "#f4f7ff"
  ink-2: "#b6c6e8"
  ink-3: "#8ea3c9"
  line: "rgba(142, 163, 201, 0.18)"
  door-ink: "#050b1c"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(3.4rem, 16.5vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(2.2rem, 9vw, 3.2rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.1
  score:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum"
  row:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
rounded:
  badge: "6px"
  mark: "8px"
  stream: "14px"
  door: "16px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "16px"
  lg: "32px"
  section: "72px"
  section-wide: "96px"
components:
  button-discord:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.door-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.door}"
    height: "62px"
  button-discord-hover:
    backgroundColor: "#ffffff"
  copy-row:
    backgroundColor: "{colors.deep-navy}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "6px 6px 6px 16px"
    height: "48px"
  copy-action:
    textColor: "{colors.lume-cyan}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  copy-action-ok:
    backgroundColor: "{colors.lume-cyan}"
    textColor: "{colors.night}"
  chip:
    textColor: "{colors.ink-3}"
    rounded: "{rounded.pill}"
    padding: "3px 12px"
  button-stream:
    textColor: "{colors.ink}"
    rounded: "{rounded.stream}"
    padding: "0 20px"
    height: "48px"
  result-mark-win:
    backgroundColor: "{colors.lume-cyan}"
    textColor: "{colors.night}"
    rounded: "{rounded.mark}"
    size: "32px"
  result-mark-loss:
    textColor: "{colors.loss-coral}"
    rounded: "{rounded.mark}"
    size: "32px"
  result-mark-draw:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.mark}"
    size: "32px"
  badge-scorer:
    textColor: "{colors.mvp-violet}"
    rounded: "{rounded.badge}"
    padding: "2px 7px"
---

# Design System: STARLINK FCX

## Overview

**Creative North Star: "El campo nocturno"**

Un estadio de noche visto desde arriba: suelo casi negro azulado, niebla del azul del club que se posa en zonas, y una luz bioluminiscente cian que solo aparece donde hay algo que hacer o algo que confirmar. Nada brilla por decorar. La luz marca la ruta (copiar el nombre, buscar el club, entrar al Discord), responde al visitante cuando se acerca y confirma lo que salió bien (copiado, victoria).

La densidad es de marcador, no de revista: filas largas separadas por hilos finos, números condensados y tabulares, poco texto corrido. La identidad es la del club (su escudo real fundido con la noche y sus azules), nunca la de EA ni la de una web genérica de estadísticas. Primero el móvil: todo se lee de arriba abajo en una columna y en escritorio se abre en dos (escudo a la izquierda, nombre y acciones a la derecha).

Se rechaza la landing genérica de club: banner con menú, rejillas de tarjetas iguales, cifras de relleno.

**Key Characteristics:**
- Fondo nocturno con niebla azul por zonas, sin superficies elevadas.
- Un solo acento de luz (cian) para rutas, foco, confirmación y victoria.
- Violeta reservado para la distinción individual (MVP, goleador) y el enlace del stream.
- El botón del Discord es el único relleno blanco de la página.
- Filas en lugar de tarjetas; hilos de 1 px en lugar de cajas.
- Barlow Condensed pesada para todo lo que se lee de un vistazo.

## Colors

Noche azul profunda con una sola luz fría; el resto de colores son tintas de lectura.

### Primary
- **Cian bioluminiscente** (lume-cyan): la luz del sistema. Borde del botón de copiar, acción "Copiar", hilo vertical de la ruta, número de paso encendido, marca de victoria, punto de presencia, enlaces, anillo de foco, selección de texto y el charco de luz bajo el botón del Discord. Aparece también en transparencias (0.15 a 0.45) para hilos y halos.

### Secondary
- **Violeta MVP** (mvp-violet): distinción individual. Estrella y conteo de MVP, insignia "Goleador", cifra de goles del goleador, borde del botón del stream. Fondo de insignia al 16 %.

### Tertiary
- **Coral derrota** (loss-coral): solo para resultados en contra (marca D, conteo de derrotas) y el estado de error al copiar. Nunca como acento decorativo.

### Neutral
- **Noche** (night): suelo de la página, color de tema del navegador, texto sobre cian.
- **Azul abismo** (deep-navy): relleno translúcido (70 %) de la fila de copiar.
- **Niebla del club** (club-fog): el azul del escudo, usado solo como niebla (gradientes radiales al 45-50 %) y en el scrollbar.
- **Tinta** (ink): titulares, nombres de jugador, marcadores y relleno del botón del Discord.
- **Tinta plata** (ink-2): texto de apoyo, párrafos de los pasos, cifras secundarias de la tabla.
- **Tinta niebla** (ink-3): metadatos, cabeceras de tabla, chips, guion del marcador.
- **Hilo** (line): separadores de filas, borde de chips.
- **Tinta de puerta** (door-ink): texto del botón del Discord sobre blanco.

### Named Rules
**La Regla de la Luz Útil.** El cian solo marca rutas, foco, confirmación o victoria. Si un elemento no es un paso, una acción o un resultado favorable, no se ilumina.

**La Regla de la Única Puerta.** El botón del Discord es el único relleno blanco pleno. Ninguna otra acción compite con él en luminosidad.

**La Regla del Violeta Escaso.** El violeta distingue a una persona (MVP, goleador) o lleva al stream. No se usa para secciones, fondos ni estados.

## Typography

**Display Font:** Barlow Condensed 600/700/800 (con sans-serif)
**Body Font:** Barlow 400/500/600 (con system-ui, sans-serif)

**Character:** Condensada y pesada como el rótulo de un marcador de estadio; Barlow normal, de la misma familia, para las frases cortas que explican.

### Hierarchy
- **Display** (800, clamp(3.4rem, 16.5vw, 6rem), 0.92): solo el nombre del club en el primer pantallazo, a casi todo el ancho en móvil y sin partir (en escritorio clamp(5rem, 8.6vw, 6rem)).
- **Headline** (800, clamp(2.2rem, 9vw, 3.2rem), 1): títulos de sección ("Cómo unirte", "Últimos partidos", "Plantilla").
- **Title** (700, 26px, 1.1): título de cada paso de la ruta y texto del botón del Discord.
- **Score** (800, 32px, cifras tabulares): marcador de cada partido (28px por debajo de 380px).
- **Row** (700, 19-21px, 1.1): rival, gamertag, cifras de la tabla (600), nombre en el pie (800, 20px).
- **Body** (400, 17px, 1.5): párrafos de los pasos, máximo 60-62ch.
- **Meta** (400, 14-16px): tipo de partido y fecha, balance V/E/D, presencia del Discord, pie.
- **Label** (600-700, 13-17px, 0.04-0.06em, MAYÚSCULAS): cabeceras de tabla, chips de plataforma, acción "Copiar", insignia "Goleador", posición.

### Named Rules
**La Regla del Marcador.** Toda cifra (goles, notas, miembros, balance) va en cifras tabulares. Los números se alinean como en un tablero.

**La Regla de la Familia Única.** Solo Barlow y Barlow Condensed. Las mayúsculas espaciadas se reservan para etiquetas de datos y acciones cortas, nunca para frases.

## Layout

Columna única centrada en móvil con margen lateral de 16px; contenedor máximo de 1120px (margen 32px desde 900px). Las secciones de contenido se estrechan a 760px y se separan con 72px (96px en escritorio); el pie se aparta 88px. El primer pantallazo ocupa la altura visible (100svh): escudo, nombre, fila de copiar y chips arriba, y el botón del Discord (máx. 440px) empujado al pie del pantallazo. Desde 900px el primer pantallazo pasa a rejilla de dos columnas (0.9fr / 1.1fr, separación 48px, alto máx. 860px): escudo centrado a la izquierda (hasta 420px), nombre y acciones alineados a la izquierda.

Los cortes reales son 380px (fila de copiar y marcador más compactos, pie en dos columnas), 560px (tabla más apretada, se oculta la insignia "Goleador") y 900px. Ritmo de espaciado: 8 / 14 / 16 / 32, con 12-18px de relleno vertical en filas.

## Elevation & Depth

Sistema plano. La profundidad viene de la luz y la niebla, no de sombras: gradientes radiales de la niebla del club sobre el suelo nocturno (uno alto detrás del escudo, uno bajo a la derecha), el escudo enmascarado con un degradado radial para fundirse con la noche, y halos cian de baja opacidad. La única sombra es la del botón del Discord, que lo despega del charco de luz.

### Shadow Vocabulary
- **Sombra de puerta** (`box-shadow: 0 16px 30px -12px rgba(0, 0, 0, 0.8)`): solo bajo el botón del Discord.

### Named Rules
**La Regla de Luz, no Sombra.** Para destacar algo se enciende (halo o hilo cian), no se levanta. Ninguna superficie lleva sombra salvo la puerta.

**La Regla de la Proximidad.** Las filas interactivas (pasos, partidos, jugadores) se encienden cuando el puntero se acerca (radio de 140px) o, en táctil, al cruzar el centro de la pantalla: un halo cian de hasta 16 % y un hilo inferior que sigue al puntero. Transición de 0.6s con la curva de salida suave del sistema; sin movimiento si el usuario pide reducirlo.

## Shapes

Formas suaves y funcionales. Píldora completa (999px) para lo que se toca o etiqueta en línea (fila de copiar, acción, chips); 16px para la puerta del Discord y 14px para el botón del stream; 8px para la marca de resultado y 6px para la insignia y el anillo de foco; círculo para los números de paso y el punto de presencia. Los bordes son hilos de 1px. Las filas no tienen caja: solo un hilo inferior.

## Components

### Botones
- **Puerta del Discord (primario único):** relleno tinta, texto tinta de puerta, 62px de alto, ancho completo hasta 440px, logo de Discord en SVG a 26px. Al pasar el puntero se vuelve blanco puro y sube 2px; al pulsar baja 1px (0.35s). Debajo, un charco de luz cian al 20 % y la presencia real ("N en línea · N miembros") con punto cian.
- **Stream (secundario, condicional):** contorno violeta de 1px, 14px de radio, 48px de alto, texto tinta en Barlow Condensed 700 20px. Solo existe si hay URL del stream.
- **Enlaces de texto:** cian, subrayado de 1px que engrosa a 2px al pasar el puntero.

### Fila de copiar (componente firma)
Píldora con contorno cian al 45 % en reposo y relleno azul abismo translúcido: etiqueta "Nombre exacto en EA FC 27" en tinta plata y, a la derecha, la acción "Copiar" con contorno cian y texto cian en mayúsculas condensadas. Al copiar, la acción se rellena de cian con texto noche ("Listo") y la etiqueta pasa a "Copiado. Pégalo en Buscar club"; si falla, borde coral y "No se pudo copiar: escríbelo tal cual". Vuelve al reposo a los 2.2s. Mínimo 48px de alto (56px en escritorio).

### Chips
- **Estilo:** contorno hilo, sin relleno, texto tinta niebla, Barlow Condensed 600 en mayúsculas espaciadas. Solo datos fijos del club (juego, plataforma, crossplay); no son interactivos.

### Ruta de pasos (componente firma)
Lista numerada vertical. Cada paso: número en círculo de 34px sobre fondo noche, título condensado de 26px y una línea de explicación. Un hilo cian vertical une los círculos, de cian pleno arriba a cian al 15 % abajo. Con la proximidad, el círculo pasa de contorno al 30 % a relleno cian con número noche.

### Filas de partido
Rejilla de tres columnas: marca de resultado (32px, 8px de radio: V cian con letra noche, D coral al 16 % con letra coral, E plata al 16 %), marcador en cifras tabulares de 32px y rival con metadatos (tipo · fecha · nota de abandono). Hilo inferior; se encienden por proximidad.

### Tabla de plantilla
Cabeceras en etiqueta mayúscula tinta niebla, cifras condensadas alineadas a la derecha, goles en tinta 800. El goleador lleva la insignia violeta "Goleador" y su cifra de goles en violeta; los MVP muestran estrella violeta en SVG. Desbordamiento horizontal contenido en su envoltorio.

### Superficie relacionada
El renderizador de imágenes de partido para Discord (`lib/match-card.tsx`) comparte la paleta azul nocturna y Barlow Condensed, pero tiene su propio vocabulario de cartas y colores de estado; no se rige por este documento.

## Do's and Don'ts

### Do:
- **Do** reservar el cian (#38e0e0) para rutas, foco, confirmación y victoria (La Regla de la Luz Útil).
- **Do** mantener el botón del Discord como único relleno blanco y como acción final del primer pantallazo.
- **Do** separar el contenido en filas con hilos de 1px (rgba(142, 163, 201, 0.18)) en lugar de cajas.
- **Do** usar Barlow Condensed con cifras tabulares para toda cifra y todo título.
- **Do** dar profundidad con niebla del club (#173679 en gradientes radiales) y halos cian, no con sombras.
- **Do** usar la curva cubic-bezier(0.16, 1, 0.3, 1) entre 0.35s y 0.6s para transiciones, y anularlas con reduced-motion.
- **Do** usar iconos SVG en línea con `currentColor`.

### Don't:
- **Don't** construir rejillas de tarjetas iguales, banners con menú ni secciones de relleno de landing genérica.
- **Don't** usar el violeta (#b48cff) para fondos, secciones o estados; solo distinción individual y el stream.
- **Don't** usar el coral fuera de derrotas y errores.
- **Don't** añadir sombras a filas, chips o botones secundarios; la única sombra es la de la puerta.
- **Don't** usar otra familia tipográfica que Barlow / Barlow Condensed.
- **Don't** mostrar cifras, testimonios o logros que no salgan de partidos reales.


## Cambios 2026-11-23

- Se quitó la fila de copiar el nombre y los chips de plataforma (el club es multiplataforma): bajo el nombre va solo la línea "Club de EA FC 27" (label 20px, tinta plata). Las secciones de copiar y chips de arriba quedan obsoletas.
- Bajo la puerta del Discord hay botones secundarios de contorno (hilo, 14px de radio, 50px de alto): Twitch con icono violeta y, cuando exista el enlace, WhatsApp con icono verde. Nunca en blanco: el blanco pleno sigue siendo solo del Discord.
- La ruta pasa a: buscar en el juego, Discord, Twitch.
- Bajo el nombre, la división actual: escudo oficial de EA (56px, sombra suave) + "División N" (Barlow Condensed 800, 28px) y debajo "Club de EA FC 27 · Skill Rating N" en label. La división se fija a mano en `club_status`; el Skill Rating lo actualiza el sync.
