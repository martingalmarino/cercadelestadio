# cercadelestadio

Guía de hoteles cerca de estadios y recitales en Argentina. La aplicación está en `web/` y usa Next.js.

## Desarrollo

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

## Variables de entorno

Definilas en `web/.env.local` para desarrollo y en el proyecto de Vercel para producción. El ejemplo está en `web/.env.example`.

- `AFFILIATE_ID`: identificador de afiliado. El único helper, `web/src/lib/affiliate.ts`, lo envía como `aid`. El sub-id (`label`) es el slug del evento. En la ficha de un estadio, si hay un próximo show, se usa ese slug; si no, el slug del estadio. Sin `AFFILIATE_ID` el enlace abre la búsqueda igual, sin identificador.
- `SITE_URL`: URL pública del sitio, sin barra final. Si no está, se usa `https://www.cercadelestadio.com`. Define la base canónica, los `canonical` y `sitemap.xml`. En producción, un valor sin `www` o con `vercel.app` se reemplaza por ese dominio.

## Cómo sumar contenido

Los datos están en JSON, en `web/content/`. Al guardar, el servidor de desarrollo recarga las páginas. Un deploy nuevo publica las rutas.

Los slugs van en minúsculas, con guiones, y no se repiten dentro de cada archivo.

### Ciudad

En `cities.json`:

- `slug`: queda en `/ciudad/[slug]`
- `name`

### Estadio

En `venues.json`. `citySlug` tiene que existir en `cities.json`. La ruta es `/estadio/[slug]`.

- `slug`, `name`, `address`, `citySlug`, `neighborhood`
- `capacity`, `hotelsWithin3km`
- `accessLabel`, `accessValue` (por ejemplo la línea de subte)
- `neighborhoods`: `range`, `name`, `summary`, `pros`, `cons`
- `transit`: pasos con `label`, `title`, `detail` y, si hace falta, `badges` o `segments`
- `returnAdvice`: `label`, `title`, `text`
- `closures`: cada corte lleva `from`, `detail`, `type` y `example: true`
- `faq`: `question`, `answer`

### Evento

En `events.json`. La ruta es `/evento/[slug]`. Ese slug es el sub-id del enlace de afiliado.

- `slug`, `artist`, `citySlug`, `type`
- `venueSlug`: slug de un estadio, o `null` si el recinto todavía no está confirmado
- `date`: `YYYY-MM-DD`
- `dateExact`: `true` si el día está confirmado. Si solo se conoce el mes, poné `false` y usá el último día de ese mes en `date`
- `doors` y `showTime`: `HH:MM` o `null`
- Opcionales: `duration`, `plan` (misma forma que `transit`) y `closures` propios del show

Pasada la fecha, en el calendario de Buenos Aires, la ficha pasa a finalizado y apunta al próximo evento de ese recinto.

### Hotel

En `hotels.json`. Cada hotel pertenece a un estadio (`venueSlug`).

- `slug`, `venueSlug`, `name`, `detail`, `neighborhood`
- `walkMinutes`, `driveMinutes`, `distanceKm`, `pricePerNight`
- `example`: tiene que ser `true`. El cargador de datos rechaza cualquier hotel que no esté marcado como ejemplo
- Opcionales: `lat` y `lng`. En los hoteles de ejemplo son un punto calculado a partir de la distancia, no una dirección real

## Deploy en Vercel

1. Importá el repositorio en Vercel.
2. En Settings, Root Directory: `web`.
3. El framework es Next.js. El comando de build es `npm run build`.
4. Cargá `AFFILIATE_ID` y `SITE_URL` en Production (y en Preview si los previews tienen que compartirlos).
5. Deploy.

Antes de publicar, `npm run build` dentro de `web/` tiene que terminar sin errores.
