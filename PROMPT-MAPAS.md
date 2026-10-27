# Prompt para Cursor — Mapas reales de estadios (MapLibre + OpenFreeMap)

> Pasalo **de a un paso**. Al final de cada paso: `cd web && npm run lint && npm run build` tiene que pasar sin errores antes de seguir. Revisá el diff vos antes de commitear.

## Contexto (pegalo siempre arriba de cada paso)

Proyecto Next.js 16 (App Router) en `web/`. Antes de escribir código leé `web/AGENTS.md` y las guías de `node_modules/next/dist/docs/` (esta versión de Next tiene cambios). Hoy el mapa es un SVG esquemático falso:

- `web/src/components/venue-map.tsx` → `VenueMap({ venueName, hotels })`, dibuja calles inventadas, anillos con radios fijos y marcadores en `hotel.mapX/mapY` (o un ángulo calculado).
- Se usa en `web/src/app/estadio/[slug]/page.tsx` (línea ~131), justo arriba de `<HotelTable>`.
- `web/src/components/hotel-table.tsx` → tabla `.hot`, columna "N°" = `index + 1`. Ese número tiene que coincidir con el marcador del mapa.
- Tipos en `web/src/lib/types.ts`: `Venue` y `Hotel` **no tienen coordenadas** (solo `mapX/mapY` de pantalla). Datos en `web/content/venues.json` y `web/content/hotels.json`; loaders en `web/src/lib/content.ts`.
- Estilos en `web/src/app/globals.css` (y tokens si ya aplicaste `mejora-diseno`: `--bg`, `--surface`, `--text`, `--accent:#00704a`, `--c-gray-100:#ebebeb`, `--c-gray-200:#dcdcdc`, `--c-ink-900:#141414`, `--radius:0`, `--font:Inter`, `--focus:#0a84ff`). Usá esos tokens; nada de colores sueltos.

Look: señalética sobrio. Fondo gris claro, acento verde oscuro, esquinas rectas, Inter, sin sombras ni emojis.

Reglas: no agregues API keys. No uses iframes. No cambies el comportamiento de los links de afiliado.

---

## Paso 1 — Coordenadas en los datos

1. En `types.ts` agregá a `Venue`: `lat: number; lng: number; osm?: { type: "way" | "relation"; id: number }` y a `Hotel`: `lat?: number; lng?: number`. Marcá `mapX/mapY` como `@deprecated` (se borran en el paso 6).
2. Completá `venues.json`. Para el Monumental: `lat: -34.54529, lng: -58.44974, osm: { type: "relation", id: 1646999 }` (verificado en OSM: relation 1646999, `leisure=stadium`). Para los demás estadios buscá el id en openstreetmap.org y dejá un `// TODO verificar` en el PR si no estás seguro.
3. Hoteles de ejemplo: si no tienen `lat/lng`, calculalas a partir de `distanceKm` + un rumbo fijo con `@turf/destination` en un script, solo como placeholder (siguen siendo `example: true`).

**Aceptación:** build pasa; todos los venues tienen `lat/lng`; ningún tipo `any`.

## Paso 2 — Script de contornos OSM (se corre una vez, no en build)

Creá `web/scripts/fetch-venue-outlines.mjs` (Node 20, `fetch` nativo, sin dependencias salvo `osmtogeojson`):

- Lee `content/venues.json`, para cada venue con `osm` arma la query Overpass:
  ```
  [out:json][timeout:25];
  relation(1646999);   // o way(ID) según osm.type
  out geom;
  ```
  y la manda por POST (`data=` urlencoded) a `https://overpass-api.de/api/interpreter` con un `User-Agent` propio ("cercadelestadio/1.0 (tu-mail)"). Si falla o hace timeout, reintentá en `https://overpass.kumi.systems/api/interpreter`. Si sigue fallando, usá como respaldo Nominatim: `https://nominatim.openstreetmap.org/lookup?osm_ids=R1646999&format=geojson&polygon_geojson=1` (R = relation, W = way; máx. 1 request/segundo).
- Convierte a GeoJSON (`osmtogeojson`), se queda con el polígono, redondea coordenadas a 6 decimales y guarda `content/outlines/<slug>.geojson` como Feature con `properties: { osmType, osmId, source, fetchedAt }`.
- Agregá `"outlines": "node scripts/fetch-venue-outlines.mjs"` en `package.json`. Los GeoJSON se **commitean**: la página nunca consulta Overpass.

**Aceptación:** `npm run outlines` genera `content/outlines/estadio-monumental.geojson` con un Polygon/MultiPolygon válido (pegalo en geojson.io y tiene que caer sobre el estadio); archivo < 30 KB.

## Paso 3 — Dependencias y estilo del mapa

1. `npm i maplibre-gl @turf/circle @turf/helpers` (+ `@turf/destination` si lo usaste en el paso 1, como devDependency).
2. Creá `web/src/lib/map-style.ts`: toma el JSON de `https://tiles.openfreemap.org/styles/positron` como base (descargalo y guardalo en `web/src/lib/map-style.base.json` para no depender en runtime del estilo, solo de los tiles) y sobreescribí colores:
   - fondo/land `#ebebeb`, agua `#dcdcdc`, parques `#e3f1ea`, calles blancas, calles principales `#ffffff` con borde `#c4c4c4`, edificios `#dcdcdc`.
   - etiquetas en `#5f5f5f`, sacá POIs y casi todos los íconos; dejá nombres de barrios y calles principales.
   - fuentes: las de OpenFreeMap (Noto Sans) para las etiquetas del mapa; Inter queda para la UI propia.
3. Atribución: dejá `attributionControl` compacto con "© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors" (con link a openstreetmap.org/copyright). Nunca se oculta.

**Aceptación:** build pasa; el estilo carga sin key; la atribución se ve.

## Paso 4 — Componente interactivo (client)

Creá `web/src/components/map/venue-map-interactive.tsx` (`"use client"`), importando `maplibre-gl/dist/maplibre-gl.css` solo ahí.

Props: `{ venue: { name, lat, lng }, outline: GeoJSON.Feature | null, hotels: { slug, name, lat, lng }[], activeSlug, onActiveChange }`.

- Centro en el estadio, `fitBounds` al anillo de 3 km (o a los hoteles si alguno queda afuera), `cooperativeGestures: true` (no secuestra el scroll en celular), sin rotación (`dragRotate: false`, `pitchWithRotate: false`).
- Capas:
  - Contorno del estadio: fill `#141414` opacidad 0.85 + línea `#141414`. Si no hay outline, un cuadrado negro chico en el centro (como el SVG actual).
  - Anillos 1/3/5 km con `circle([lng, lat], r, { units: "kilometers", steps: 96 })`: línea `#00704a`, 1.5px, `line-dasharray: [2, 2]`, etiquetas "1 KM / 3 KM / 5 KM" en verde arriba de cada anillo.
- Marcadores de hotel: elementos HTML (`maplibregl.Marker({ element })`) cuadrados 24×24, negros, número blanco en Inter 800, el mismo `index + 1` que la tabla. Cada uno es un `<button>` con `aria-label="Hotel N: Nombre, X km"`. Activo = fondo `#00704a` y z-index arriba.
- Click/hover/focus en marcador → `onActiveChange(slug)`. Cambio de `activeSlug` → resalta el marcador y hace `easeTo` suave solo si quedó fuera de pantalla.
- Limpieza correcta en unmount (`map.remove()`), sin warnings en StrictMode.

## Paso 5 — Carga diferida + vínculo con la tabla

1. `web/src/components/map/venue-map-static.tsx` (server component): versión liviana sin JS. Reutilizá el SVG actual pero dibujado con coordenadas reales proyectadas (equirectangular simple alrededor del estadio): contorno, anillos y marcadores numerados, sin calles inventadas. Nada de imágenes externas.
2. `web/src/components/map/venue-map.tsx` (`"use client"`, reemplaza al actual):
   - Muestra el estático + un botón "Ver mapa interactivo".
   - Carga el interactivo con `next/dynamic(() => import("./venue-map-interactive"), { ssr: false, loading: () => static })` cuando el usuario toca el botón **o** cuando el bloque entra en viewport (`IntersectionObserver`, `rootMargin: "200px"`) y la conexión no es `saveData`.
   - Mismo alto fijo en los dos estados (por ejemplo `aspect-ratio: 16/10`, 4/5 en mobile) → CLS = 0.
3. Estado compartido estadio ↔ tabla: creá un wrapper client `VenueHotels` que contenga mapa + `HotelTable` y maneje `activeSlug`. `HotelTable` recibe `activeSlug`/`onActiveChange` opcionales: la fila activa tiene `aria-current="true"` y la clase `.is-active` (borde izquierdo 3px verde, fondo `#e3f1ea`); hover/focus en la fila activa el marcador. En `/evento/[slug]` la tabla sigue funcionando sin mapa (props opcionales).
4. Leé el GeoJSON en el server (`fs` en `content.ts`, `getVenueOutline(slug)`) y pasalo como prop; no lo importes en el bundle de cliente.

**Aceptación:** con JS desactivado se ve el mapa estático y la tabla completa; con red lenta (DevTools "Slow 4G") el primer render no descarga `maplibre-gl` (chequealo en Network); el chunk de MapLibre solo aparece al tocar/scrollear; hover en fila 3 resalta marcador 3 y viceversa.

## Paso 6 — Accesibilidad, limpieza y QA

- La **tabla es la fuente principal**: el mapa lleva `role="region"` + `aria-label="Mapa de {venue} con hoteles cercanos"` y un texto `sr-only` "La lista de hoteles de abajo tiene la misma información". El canvas de MapLibre queda `aria-hidden`; los marcadores-botón sí son navegables con Tab y tienen foco visible (`--focus`).
- `prefers-reduced-motion`: sin `easeTo`/animaciones.
- Borrá `mapX/mapY` de tipos y JSON y el `venue-map.tsx` viejo.
- `npm run lint && npm run build` sin warnings nuevos; Lighthouse mobile en `/estadio/estadio-monumental`: Performance ≥ 90, Accessibility ≥ 95, CLS < 0.05.
- Probá en 375px, 768px y 1280px: no hay scroll horizontal, los gestos del mapa no bloquean el scroll de la página.

**Entrega:** resumen de archivos tocados, peso del chunk de MapLibre y captura del mapa en desktop y mobile.
