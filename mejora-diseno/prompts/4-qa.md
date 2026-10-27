# Prompt 4 — QA visual y accesibilidad

1. Agregá Playwright como devDependency en `web/` y un script `npm run shots` (`web/scripts/shots.ts`). El script captura `/`, `/estadio/estadio-monumental`, `/evento/mana-estadio-monumental` y `/ciudad/buenos-aires` en 1440, 1024, 768 y 390 px (full page) y las guarda en `web/.shots/`, que tiene que ir en `.gitignore`.
2. Agregá `@axe-core/playwright` y un test `web/tests/a11y.spec.ts` que falle con violaciones serias o críticas en esas 4 rutas.
3. Revisá a mano y corregí:
   - Contraste AA (texto muted ≥ 4.5:1).
   - Foco visible en header, botones, filas y FAQ.
   - Targets ≥ 44 px en mobile.
   - Que no haya overflow horizontal a 390 px (`document.documentElement.scrollWidth <= 390`).
   - Que no haya CLS por el countdown.
   - Que haya un solo h1 por página, con h2 en las bandas.
4. Revisá la consistencia con `docs/design/`: solo Inter, radio 0, sin sombras, sin emojis, verde solo para acción o acento.
5. Documentá el sistema en `web/DESIGN.md`: tabla de tokens, lista de componentes con props y ejemplo, y reglas (cuándo banda, cuándo intro, cuándo Button o ArrowLink).
6. Actualizá `web/README.md` con `npm run shots` y el test de accesibilidad.

Criterio de aceptación: test de a11y en verde y capturas generadas para revisar. Pasame la lista de lo que corregiste.
