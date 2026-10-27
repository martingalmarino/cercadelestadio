# Prompt 2 — Componentes base

Usá los tokens de `web/src/styles/tokens.css`. Estilos con CSS Modules por componente (`*.module.css` al lado del `.tsx`), sin Tailwind ni librerías UI. Esquinas rectas, sin sombras, sin emojis. Referencia visual: `docs/design/home.html` y `docs/design/base.css`.

Creá o refactorizá en `web/src/components/`:
1. `ui/button.tsx`: `<Button>` y `<ButtonLink>` (next/link o `<a>` externo).
   - Variantes `primary` (verde), `secondary` (negro) y `ghost` (borde 2 px).
   - Tamaños `md` (44 px) y `lg` (64 px).
   - Hover con `--accent-hover`.
   - Prop `affiliate`: agrega `rel="sponsored nofollow" target="_blank"` y arma el href con `affiliateHref` de `web/src/lib/affiliate.ts`.
2. `ui/text-link.tsx`: `TextLink` (subrayado de 1 px, offset 3) y `ArrowLink` (borde inferior verde de 2 px, sin "→").
3. `ui/tag.tsx`: estilo neutro y estilo `ok`.
4. `site-header.tsx`:
   - Estado activo con `usePathname`, como client component chico solo para la nav.
   - Menú mobile debajo de 768 px: botón "Menú" con `aria-expanded` y panel en una lista vertical.
   - Links a `/#eventos`, `/#estadios` y `/#como-funciona`.
5. `site-footer.tsx`: 12 columnas (about 6, Estadios 3, Ciudades 3). Los links se generan desde `getVenues()` y `getCities()` de `web/src/lib/content.ts`. Debajo va la línea legal y el disclosure de afiliados.
6. `section-band.tsx`: mantené la API (`index`, `title`, `titleId`, `meta`) y pasá a min-height `--band-h` y título en `--fs-md`. Sumá `section-intro.tsx` (párrafo de 60ch + acción opcional a la derecha).
7. `row-list.tsx` + `event-row.tsx`: reemplazan las `<table>` de eventos.
   - Desktop: grid `140px 2fr 2fr 140px auto`. Tablet: 3 columnas. Mobile: 2 columnas.
   - Fecha grande con año en label. Si `event.approximate`, mostrá "MAR 2027" + `Tag` "a confirmar" (usá `eventDateLabel` de `web/src/lib/format.ts`).
   - Toda la fila es el link.
8. `hotel-table.tsx` → `hotel-list.tsx`.
   - Mismas columnas que hoy, pero con grid responsivo en lugar de `<table>`: n°, nombre + detalle, barrio, a pie/auto, km, precio/noche y `ButtonLink` primary affiliate "Ver disponibilidad".
   - Mobile como el mockup `monumental-mobile`: número a la izquierda, km y precio a la derecha, CTA a lo ancho.
   - Mantené `role="list"` y un encabezado visual oculto en mobile.
9. `countdown.tsx`: recibí `initialNow` desde el server (`getCachedNow()` de `web/src/lib/time.ts`) para no mostrar "—". Actualizá cada 30 s, no cada 1 s. `aria-live` solo en los días. Que renderice su propio bloque, no hijos de `.facts`.
10. `venue-map.tsx`: marcadores de 28 px, leyenda debajo con la lista numerada que linkea a `#hotel-{slug}`, y caption fuera del SVG.
11. `breadcrumbs.tsx`: `<nav aria-label="Migas">` con `<ol>`. Reemplaza los `.crumb` de las tres páginas.
12. `faq-list.tsx`: pasá a `<details>/<summary>` nativos con estilos.
13. `stat-row.tsx`: reemplaza `.facts` (4 o 5 columnas en desktop, 2 en mobile).

Todavía no toques las páginas, salvo para que compilen. Criterio de aceptación: build y lint en verde, sin estilos de estos componentes en `globals.css`.
