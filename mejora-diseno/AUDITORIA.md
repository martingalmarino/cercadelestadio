# Auditoría de diseño — cercadelestadio (27/10/2026)

Repo: `martingalmarino/cercadelestadio` @ `fa7ff3c` · Deploy: https://web-iota-swart-48.vercel.app/
Capturas "antes": `antes/{home,estadio,evento}-{desktop,mobile}.png` (1440 y 390 px).
Propuesta: `propuesta/home.html` + `tokens.css` + `base.css`, capturas `propuesta/home-{desktop,mobile}.png`.

## Diagnóstico general
El sitio respeta bastante bien la idea de v3 (bandas oscuras, Inter, esquinas rectas, verde #00704a). El problema no es el estilo sino la **base**: todo vive en un único `web/src/app/globals.css` de ~700 líneas con valores sueltos, clases crípticas (`.w`, `.g`, `.n`, `.D`, `.st`, `.x`, `.o`, `.r`) y nada de tokens. Cada página nueva va a seguir copiando px a mano. Además, a 1440 px la home se ve como una planilla: todo tiene el mismo peso y nada guía la vista.

## Problemas priorizados

### P1 — No hay sistema de tokens (bloqueante para escalar)
- `globals.css` repite colores sueltos (#1a1a1a, #232323, #6b6b6b, #9a9a9a, #bdbdbd, #dadada, #00704a, #3dbe8b, #008065, #5ba4cf…) y tamaños (11, 12, 13, 14, 15, 17, 18, 20, 28, 64, 72 px) sin escala.
- Hay tres breakpoints que se pisan: 860, 640 y 600 (`.event-head` está duplicado en 860 y 600).
- Usa `!important` en `.cols` mobile y pone `font-feature-settings:"tnum"` en todo el body: los números tabulares tienen que ir solo en cifras.
- `venue-map.tsx` tiene colores hardcodeados en el SVG.
- **Fix:** `tokens.css` con variables semánticas, más una escala tipográfica, de espaciado y de breakpoints (ver propuesta).

### P2 — Tipografía chica y jerarquía plana
- El body está en 15 px. Labels, `th`, `.crumb` y `.lab` usan 11–12 px en mayúsculas y gris (#9a9a9a sobre #232323 queda en contraste ~5:1, al límite; #6b6b6b a 11 px se lee mal). En mobile los `td` bajan a 13 px y `.mut` a 13 px.
- En la home, el h1 a 64 px es lo único con peso. Eventos, estadios y ciudades tienen la misma densidad visual, así que no hay punto focal ni un "próximo show" destacado.
- **Fix:** base de 16 px, label mínimo de 13 px, escala 13/14/16/18/22/28/44/88 y display fluido con `clamp()`.

### P3 — Responsive: tablas metidas a la fuerza en 390 px
- En la home mobile, "Próximos eventos" y "Estadios" siguen siendo `<table>` de 4–5 columnas: el texto se parte en 3 líneas y aparecen columnas de 60 px ("Tomás A. Ducó (Huracán)" en 3 renglones).
- El buscador mobile corta el placeholder ("Busc…") porque el input de fecha mide 180 px fijos.
- `.top nav` se oculta debajo de 600 px **sin menú alternativo**, así que en mobile no hay navegación.
- `.hot` solo se apila debajo de 640 px. Entre 640 y 860 la tabla de 7 columnas queda apretada.
- **Fix:** un componente de filas responsivas (grid en lugar de table para los listados) y un menú mobile.

### P4 — Componentes sin contrato: links, CTAs y botones mezclados
- El CTA de afiliado, que es el que genera plata, es un link verde de 600 con "→" en desktop y un bloque negro en mobile. No hay `Button` con variantes.
- "Ver →", "Hoteles cerca →" y "Ver disponibilidad →" usan el mismo estilo que cualquier link interno.
- El botón "Buscar" mide 48 px de alto y no tiene estado hover. El `:focus-visible` es de 1 px verde sobre fondo oscuro, casi invisible.
- La banda se usa para todo (hasta 6 por página). Sin intro de sección ni ritmo, la página de estadio queda en "banda, tabla, banda, tabla".
- **Fix:** `Button` (primary/secondary/ghost, sm/md/lg, alto mínimo 44 px), `TextLink`/`ArrowLink`, `SectionBand` + `SectionIntro`, `Tag`.

### P5 — Accesibilidad y semántica
- Los inputs del buscador no tienen `<label>` visible (solo aria-label). "Fecha" es `type="text"` y el form apunta a `/` sin manejar `q`, así que la búsqueda no hace nada.
- Contraste: #9a9a9a sobre #1a1a1a está bien, pero `.mut` #6b6b6b a 11–13 px sobre #ededed queda en ~4.6:1, en el límite para texto chico.
- El countdown muestra "—" hasta hidratar (layout shift). `aria-live` en un nodo que cambia cada segundo es ruidoso.
- El mapa es un SVG decorativo con marcadores de 22 px que se superponen. Falta la leyenda que vincule cada número con su fila de hotel.
- FAQ: el botón no expone `aria-expanded` ni `aria-controls` (verificar `faq-list.tsx`).

### Otros (P6+)
- **Grilla:** `.w` de 1280 + 32 px sin columnas. `.cols-5`, `.cols-3` y `.facts` inventan su propia grilla. Hace falta una grilla de 12 columnas con gap de 24.
- **Color:** hay dos verdes distintos (#00704a y #008065 en `.D`) y #3dbe8b en el dark. Hay que unificar en `--accent` y `--accent-on-dark`.
- **Ciudades:** son celdas casi vacías ("Próximamente"). Sacar de la home las ciudades sin estadio o bajarlas al footer.
- **Fechas aproximadas** (Montaner 03/2027): hoy se ven como "03/2027". En la nueva fila de fecha hay que mostrarlas como "MAR 2027 · a confirmar", nunca como un día inventado.
- **Footer:** es un párrafo único. Le faltan columnas de navegación (estadios, ciudades) para el SEO interno.
- **Ficha de evento:** la `date-card` verde está bien, pero el countdown en `.facts` compite con 5 datos iguales. El countdown tiene que ser un componente propio.

## Consistencia con v3
Bien: bandas numeradas, Inter, esquinas rectas, paleta. Desvíos: el header perdió el estado activo, el hero de la home es más pobre que en v3, se agregaron "Ciudades" y "Cómo funciona" con celdas genéricas tipo tarjeta, y el mobile tiene menos cuidado que el PNG `monumental-mobile`.

## Base de diseño propuesta
Ver `propuesta/tokens.css` (fuente de verdad) y `propuesta/base.css` (componentes de referencia).

| Token | Valor |
|---|---|
| Tipografía | Inter. label 13 · sm 14 · base 16 · md 18 · lg 22 · xl 28 · 2xl clamp(32–44) · display clamp(40–88). lh 1.02 / 1.2 / 1.5 |
| Espaciado | base 4: 4 8 12 16 24 32 48 64 96 |
| Color | ink 900 #141414 / 800 #1c1c1c · gray 500 #5f5f5f (texto muted, ≥ 6:1) · border #dcdcdc · bg #ebebeb · accent #00704a / hover #005c3c / on-dark #5fd3a3 · focus #0a84ff |
| Breakpoints | sm 480 · md 768 · lg 1024 · xl 1280 |
| Grilla | contenedor 1280, gutter clamp(16–40), 12 columnas, gap 24 |
| Forma | radio 0, bordes 1 px y 2 px (strong), tap mínimo 44 px |

Componentes base:
- `SiteHeader`: activo, menú mobile.
- `SiteFooter`: 4 columnas más la nota legal.
- `SectionBand` y `SectionIntro`.
- `Hero` (home y lugar) con `StatRow`.
- `EventRow`/`RowList`: fecha grande, título, subtítulo y CTA.
- `HotelRow`/`HotelList`: n°, nombre, barrio, a pie/auto, km, precio y CTA primario de afiliado.
- `EventSheet`: date-block y datos.
- `Countdown`: SSR con días ya calculados, sin "—".
- `VenueMap` con leyenda.
- `Button`, `TextLink`, `ArrowLink`, `Tag`, `Breadcrumbs`, `Faq` (usar `<details>`).
