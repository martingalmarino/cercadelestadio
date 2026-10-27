Creá `.github/workflows/ingest-events.yml` en la raíz del repo:
- `on: schedule: cron "0 12 * * *"` (09:00 hora Argentina) y `workflow_dispatch`.
- Job: checkout, Node 20, `npm ci` en `web/`, `npx playwright install --with-deps chromium`, `npm run ingest`, `npm run build` (si falla el build no abre PR), y `peter-evans/create-pull-request@v6` con branch `bot/ingest`, título "Eventos: actualización automática", body = contenido de `web/content/ingest-report.md`, labels `ingesta`.
- Secrets: `THESPORTSDB_KEY` (opcional). Permisos mínimos `contents: write`, `pull-requests: write`.
No hagas push ni crees el workflow en GitHub; solo dejá los archivos. Agregá a `web/README.md` una sección "Ingesta automática" explicando cómo activarlo y cómo revisar el PR.
