# Prompt 3 — Aplicar a las páginas

Referencia visual exacta para la home: `docs/design/home.html` y las capturas `docs/design/home-desktop.png` / `home-mobile.png`.

1. `web/src/app/page.tsx` (home):
   - Hero con grilla de 12 columnas: label, h1 en `--fs-display` (columnas 1–8), lede (1–6).
   - Bloque "Próximo show" en las columnas 9–12, con el primer resultado de `upcomingEvents` (fecha en `--accent-on-dark` y `ArrowLink` a `/evento/[slug]`).
   - Buscador con `<label>` visibles ("Evento o estadio", "Fecha" `type="date"`) y `Button` primary lg "Buscar hoteles". En mobile el buscador va apilado.
   - `StatRow`: estadios, próximos shows, ciudades con estadio, radio 1·3·5 km.
   - Sección 01 "Próximos eventos": `SectionBand`, `SectionIntro` y `RowList`/`EventRow`.
   - Sección 02 "Estadios y recintos": celdas en una grilla de 3, 2 y 1 columnas (barrio en label, nombre, `dl` con capacidad y hoteles a 3 km). Es una grilla con bordes compartidos, no tarjetas separadas.
   - Sección 03 "Cómo funciona" con número grande verde, y el disclosure de afiliados debajo.
   - Ciudades sale de la home y queda solo en el footer y en `/ciudad/[slug]`.
   - Buscador: implementá un filtro real. `/` con `?q=` filtra eventos y estadios por nombre (server, en `page.tsx` con `searchParams`) o, si preferís, redirige a la página que matchee. Si no hay resultados, mostrá un mensaje.
2. `web/src/app/estadio/[slug]/page.tsx`:
   - Hero con `Breadcrumbs`, h1 en `--fs-2xl`→display y `StatRow`.
   - Orden: 01 Hoteles por distancia (`VenueMap` + `HotelList`), 02 Barrios, 03 Cómo llegar y volver (timeline), 04 Cortes, 05 Próximos eventos (`EventRow`) y 06 FAQ.
   - Cada sección arranca con `SectionIntro` cuando tiene texto.
3. `web/src/app/evento/[slug]/page.tsx`:
   - `EventSheet`: date-block verde a la izquierda (columnas 1–3) y artista + recinto + horarios (4–12).
   - `Countdown` como bloque propio y CTA primary lg "Ver hoteles para el {fecha}" anclado a la lista.
   - Mobile: date-block y título apilados, con el CTA visible sin scroll.
4. `web/src/app/ciudad/[slug]/page.tsx` y `not-found.tsx`: mismos componentes.
5. Borrá de `globals.css` todas las clases que queden sin uso (`.w`, `.cols*`, `.facts*`, `.hot`, `.crumb`, `.g`, `.n`, `.x`, `.r`, etc.). Verificalo con `rg`.

Criterio de aceptación: build OK, ningún `<table>` en listados (solo se permite en "Cortes", con scroll horizontal en mobile) y textos en español rioplatense sin cambios de contenido.
