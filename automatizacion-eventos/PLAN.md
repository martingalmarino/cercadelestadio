# Plan: ampliar y automatizar eventos — cercadelestadio

Estado actual (repo `web/`): eventos cargados a mano en `web/content/events.json`, tipo `ShowEvent` en `web/src/lib/types.ts`, lectura en `web/src/lib/content.ts`, filtros de fecha en `web/src/lib/events.ts`, rutas `src/app/evento/[slug]`, `estadio/[slug]`, `ciudad/[slug]`, `sitemap.ts`.

## 1. Fuentes (probadas con curl el 27/10/2026, hora de Córdoba)

| Fuente | Cobertura AR | Acceso | Prueba real | Veredicto |
|---|---|---|---|---|
| **Sitemap Movistar Arena** https://www.movistararena.com.ar/sitemap.xml | Total para ese venue | Público; robots.txt `Allow: /` y declara sitemap | 200, ~35 URLs `/show/<uuid>`. La ficha es SPA (sin JSON-LD en HTML) → requiere render (Playwright) o detectar su API interna | **Alta prioridad** como detector de altas/bajas |
| **TheSportsDB** https://www.thesportsdb.com/api.php | Liga Profesional (id 4406), Copa de la Liga, B Nacional, Federal A | Key de test `123` gratis (la vieja `3` está deshabilitada); Premium ~US$9/mes para más límites | `eventsnextleague.php?id=4406` devuelve partidos con fecha/hora, ids API-Football | **Mejor fuente gratis para fútbol** |
| **API-Football** (api-sports.io) https://www.api-football.com/pricing | Liga Profesional AR (league 128), Copa Argentina, Libertadores | Key obligatoria (403 sin key). Plan free 100 req/día | `/status` 403 "Missing application key" | Alternativa/backup fútbol, incluye venue |
| **Ticketek AR** sitemap https://www.ticketek.com.ar/sitemap.xml | Grande (Monumental, Vélez, Kempes, Movistar…) | robots permite `*`, bloquea `/websource/` y bots IA. Sin API pública. Leer ToS antes | Sitemap index con 2 sub-sitemaps | **Detector de URLs nuevas** (solo sitemap, bajo ritmo) |
| **All Access** https://www.allaccess.com.ar | Fuerte en estadios BA (River, Vélez) | Sin API; robots solo lista Googlebot; sitemap redirige a home | Home 200 con links `/event/<slug>`; JSON-LD solo Organization | Scraping liviano de home/listados; frágil |
| **TuEntrada** https://tuentrada.com/sitemap.xml | Interior (Córdoba, Rosario, Santa Fe) | robots `Allow: /`, `ai-train=no, search=yes` | Sitemap con `lastmod` por venue | Bueno para interior vía sitemap |
| **Passline** | Interior / Mendoza / medianos | robots `Disallow: /` para `*` | — | **No scrapear** |
| **Ticketmaster Discovery** https://developer.ticketmaster.com | Ticketmaster no opera como ticketera en AR; cobertura esperada casi nula | Key gratis (5000 req/día) | 401 sin key | Probar una vez con key; no confiar |
| **Bandsintown** https://help.artists.bandsintown.com/en/articles/9186477-api-documentation | Buena para giras internacionales que pasan por AR | `app_id` requerido, uso aprobado | 403 con app_id de prueba | Pedir app_id; útil para "artista X anuncia AR" |
| **SeatGeek** | Muy baja en AR | client_id gratis | 403 "Client is required" | Descartar |
| **Songkick API** | Buena para giras | API cerrada a nuevos partners (licencia paga) | Web 406 a curl | Descartar salvo licencia |
| **Setlist.fm** https://api.setlist.fm/docs/1.0/ | Solo shows **pasados** | Key gratis, no comercial salvo permiso | — | Útil para "historial del estadio", no para agenda |
| **PredictHQ** https://www.predicthq.com | Agrega conciertos/deportes globales incl. AR | Pago (trial) — miles US$/año | — | Solo si el sitio escala |
| **Eventbrite** | Eventos chicos; la búsqueda pública por API fue removida (2020) | Key, solo eventos propios/org | — | Descartar |
| **Wikipedia** (páginas de giras, API `api.php`) | Giras internacionales con fechas AR | Libre, CC BY-SA | — | Validación cruzada / señal de anuncio |
| **X / prensa** (cuentas de productoras: DF Entertainment, Fénix, Popart, Move Concerts; Indie Hoy, Rolling Stone AR, Clarín Espectáculos RSS) | Anuncios antes que ticketeras | X API (ya conectada al bot) / RSS | — | **Alertas tempranas** de anuncios |

### Las 3 mejores
1. **Sitemaps de venues/ticketeras** (Movistar Arena, Ticketek, TuEntrada): gratis, permitidos por robots, detectan altas y bajas.
2. **TheSportsDB** (+ API-Football de backup): fútbol con fecha, hora y estadio, gratis.
3. **Señales de anuncio** (X de productoras + RSS prensa + Bandsintown con app_id): avisan antes de que salga la venta → páginas "aproximado" antes que la competencia.

## 2. Arquitectura (stack actual, sin servidor extra)

**GitHub Actions cron** (gratis en repo público / 2000 min privados) — mejor que Vercel Cron porque escribe en el repo y abre PR.

```
.github/workflows/ingest-events.yml   (cron diario 09:00 ART = 12:00 UTC + workflow_dispatch)
web/scripts/ingest/
  sources/movistar-sitemap.ts   sources/ticketek-sitemap.ts   sources/tuentrada-sitemap.ts
  sources/thesportsdb.ts        sources/manual-signals.ts (RSS/X → solo alertas)
  normalize.ts   (nombre artista, alias de venue → venueSlug, fecha ISO, citySlug)
  dedupe.ts      (clave = slug(artista)+venueSlug+fecha; fuzzy en artista)
  merge.ts       (estados, no pisa campos editoriales: plan, duration, doors)
  run.ts         (escribe web/content/events.json + content/ingest-report.md)
web/content/venue-aliases.json  ("Estadio Mas Monumental", "River Plate" → estadio-monumental)
```

Flujo: ingesta → normaliza → deduplica → estado → diff vs `events.json` → si hay cambios, `peter-evans/create-pull-request` abre PR con el reporte (nuevos / cambiados / cancelados) → Martin revisa y mergea → Vercel redeploya solo (SSG, sin ISR necesario).

**Estados** (`status` nuevo en `ShowEvent`): `announced` (solo señal, fecha aproximada → usa `dateExact:false`), `confirmed` (en ticketera), `rescheduled`, `cancelled` (desaparece 2 corridas seguidas del sitemap + chequeo de 404 → PR, nunca auto), `past` (fecha < hoy: se mantiene la página con aviso "ya pasó" + link al venue, noindex a los 90 días — conserva SEO).

**Campo `source`** por evento: `{name, url, firstSeen, lastSeen}` para auditoría.

**Fútbol**: solo partidos "grandes" (superclásico, clásicos, Copa Libertadores/ Sudamericana, Selección) filtrados por lista de equipos/estadios en config, para no inundar el sitio. `type: "Partido"`.

### Qué queda 100% automático
- Detección de shows nuevos y bajas en venues con sitemap; fixtures de fútbol.
- Dedupe, estados, expiración de pasados, sitemap y páginas `/evento/[slug]` (ya se generan desde el JSON).
- Reporte en el PR + alerta (el PR mismo notifica por mail de GitHub).

### Qué queda manual (revisión humana)
- Mergear el PR (5 min/día). Recomiendo **no autopublicar** al inicio; con 1 mes sin errores, auto-merge solo para `type: Partido` y para cambios de estado `past`.
- Contenido editorial (plan del día, horarios de puertas, cortes) y datos de venues nuevos (barrios, transporte, hoteles).
- Mapear alias de venues nuevos.
- Leer ToS de cada ticketera antes de activar su fuente (All Access / Ticketek no tienen API; mantener 1 req/seg, user-agent identificable, solo sitemap/listados).

## 3. Costos
- GitHub Actions: $0 (dentro del free tier). Vercel Hobby: $0 (ojo: Hobby no permite uso comercial; con afiliados conviene Pro US$20/mes).
- TheSportsDB test key $0 (Premium ~US$9/mes si hace falta). API-Football free 100 req/día $0.
- Playwright en Actions para la SPA de Movistar: $0.
- Bandsintown: $0 si aprueban app_id. PredictHQ/Songkick: no ahora.

## 4. Prioridad
1. Esquema (`status`, `source`, `category`) + validación Zod — prompt 1.
2. Movistar Arena + TheSportsDB + PR automático — prompts 2-4.
3. Ticketek/TuEntrada sitemaps + venues nuevos (ver `venues.md`) — prompt 5.
4. Expiración, páginas de pasados, alertas de anuncios — prompt 6.
