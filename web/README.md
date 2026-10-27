# cercadelestadio

Guía de hoteles cerca de estadios y recitales en Argentina. El contenido, las variables de entorno y el deploy están en el README de la raíz del repositorio.

## Desarrollo

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

El sitio queda en http://127.0.0.1:3000.

## Capturas

Con el servidor de desarrollo corriendo:

```bash
npm run shots
```

Guarda la home, el Monumental, Maná y Buenos Aires en 1440, 1024, 768 y 390 px, a página completa, en `web/.shots/`. Esa carpeta no se versiona.

## Accesibilidad

```bash
npm run test:a11y
```

Playwright corre `@axe-core/playwright` en esas cuatro rutas, en 1440 y en 390 px. El test falla si hay una violación seria o crítica. También comprueba que haya un solo `h1` y que a 390 px no haya scroll horizontal.

La primera vez, instalá el navegador:

```bash
npx playwright install chromium
```

## Ingesta automática

El workflow `.github/workflows/ingest-events.yml` corre todos los días a las 09:00 (hora de Argentina) y también se puede disparar a mano. Lee Movistar Arena y TheSportsDB, actualiza `web/content/events.json` y abre un pull request para revisar. No publica solo.

Para activarlo:

1. El workflow tiene que estar en la rama por defecto. GitHub solo programa el cron desde ahí, y Actions tiene que estar habilitado en el repositorio.
2. Creá la etiqueta `ingesta` (Issues → Labels). Si no existe, el workflow no puede marcar el PR.
3. Opcional: en Settings → Secrets and variables → Actions, agregá `THESPORTSDB_KEY`. Si no está, la ingesta usa la clave de prueba `123`.
4. Actions → Ingesta de eventos → Run workflow, o esperá la corrida de las 09:00.

Si `npm run build` falla, el workflow se detiene y no abre el PR. Si no queda ningún diff, tampoco. El reporte incluye la fecha de la corrida, así que un día sin shows nuevos igual puede actualizar ese archivo.

El PR sale de la rama `bot/ingest`, con el título "Eventos: actualización automática". El cuerpo es `web/content/ingest-report.md`: fuentes, nuevos, cambiados, a revisar y sin venue. El diff incluye `events.json`, el reporte y `ingest-state.json`. Revisá artistas, fechas y recintos antes de mergear. Al mergear, Vercel vuelve a publicar el sitio.
