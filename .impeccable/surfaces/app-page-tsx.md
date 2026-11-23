---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

# Página pública del club (/)

Modo: Persuade. Visitante: gente del stream, en el móvil, llega desde un enlace del chat.
Trabajo: encontrar el club en EA FC 27 sin equivocarse de nombre y entrar al Discord. Prueba: resultados reales y plantilla con stats de Supabase.
Restricciones: solo lee Supabase (EA bloquea Vercel); enlace del stream aún sin confirmar (configurable, oculto si falta).

## Direction contract

THESIS: Un campo nocturno donde solo se iluminan las rutas que importan: el nombre exacto y la puerta del Discord. Rechaza la landing genérica de club (banner, menú, secciones de tarjetas iguales).

OWN-WORLD: Suelo casi negro azulado (#03060c) con niebla azul del club (#173679) en zonas. Luz bioluminiscente cian (#38e0e0) marca rutas, foco y confirmaciones; violeta (#b48cff) solo para el MVP/goleador. El botón del Discord es el único blanco pleno. Filas en lugar de tarjetas, hilos de luz finos, Barlow Condensed.

STORY: El visitante ve el escudo y STARLINK FCX, lo copia en un toque, sigue la ruta de 3 pasos hasta el Discord y, si baja, comprueba que el club juega de verdad (resultados, goleadores).

FIRST VIEWPORT: Escudo real arriba fundido con la noche; STARLINK FCX a casi todo el ancho; fila "Nombre exacto en EA FC 27 · Copiar"; chips PS5 · Crossplay; botón Discord blanco con miembros y en línea reales al pie del primer pantallazo.

FORM: Ruta luminosa vertical de pasos + filas que se encienden por proximidad (puntero o al entrar en pantalla). Opción 1 de la lista. seed:9366dfcde96bf9f8

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
