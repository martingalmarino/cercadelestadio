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
