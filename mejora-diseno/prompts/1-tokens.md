# Prompt 1 — Tokens y CSS base (sin cambiar markup todavía)

Contexto: Next.js App Router en `web/`. Hoy todo el estilo está en `web/src/app/globals.css` con valores hardcodeados. Referencia del sistema: `docs/design/tokens.css` y `docs/design/base.css`.

Hacé esto:
1. Creá `web/src/styles/tokens.css` copiando las variables de `docs/design/tokens.css`. Sacá el `@font-face`, porque Inter ya viene de `next/font` en `web/src/app/layout.tsx` con `--font-inter`. Dejá `--font: var(--font-inter), Inter, system-ui, sans-serif`.
2. Separá `globals.css` en:
   - `web/src/styles/base.css`: reset, body, tipografía, `:focus-visible` de 2 px con `--focus`, `.container`, `.grid` de 12 columnas, `.label` y `.tnum`.
   - `web/src/styles/utilities.css`: `.sr-only`.
   Importá los tres desde `globals.css` en el orden tokens, base, utilities, y dejá en `globals.css` solo lo legacy que todavía usen las páginas.
3. Reemplazá en `globals.css` **todos** los colores y tamaños sueltos por variables. Mapeo:
   - #1a1a1a / #232323 → `--c-ink-900` / `--c-ink-800`
   - #6b6b6b → `--text-muted`
   - #9a9a9a / #bdbdbd → `--text-inverse-muted`
   - #dadada → `--border`
   - #ededed → `--bg`
   - #00704a y #008065 → `--accent`
   - #3dbe8b → `--accent-on-dark`
   - Tamaños de 11 y 12 px → `--fs-label` (13 px). 15 px → `--fs-base` (16 px).
4. Unificá los breakpoints en md 767 y lg 1023 (borrá 600, 640 y 860 y reubicá sus reglas). Eliminá los `!important`.
5. Sacá `font-feature-settings: "tnum"` del body y aplicá `font-variant-numeric: tabular-nums` solo en `.num`, `.facts b`, `td.n` y en las fechas.
6. En `web/src/components/venue-map.tsx` reemplazá los colores hex por `currentColor` o por `var(--…)` vía `style`/`className`.

No cambies textos, rutas ni datos. Criterio de aceptación: `npm run build` pasa, no queda ningún hex fuera de `tokens.css` (verificalo con `rg "#[0-9a-fA-F]{3,6}" web/src --glob '!**/tokens.css'`) y el sitio se ve igual o mejor, nunca roto.
