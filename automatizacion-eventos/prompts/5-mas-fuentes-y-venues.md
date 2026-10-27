1. Agregá fuentes de detección por sitemap: `ticketek-sitemap.ts` (https://www.ticketek.com.ar/sitemap.xml, es un índice con sub-sitemaps) y `tuentrada-sitemap.ts` (https://tuentrada.com/sitemap.xml, trae `lastmod`). Solo leé sitemaps y, para URLs nuevas o con `lastmod` cambiado, la ficha HTML buscando JSON-LD `Event` o meta tags. Respetá robots.txt (Ticketek bloquea `/websource/`). Dejalas deshabilitadas por defecto en `config.ts` con un comentario "revisar ToS antes de activar". No agregues Passline (su robots bloquea todo).
2. Agregá a `web/content/venues.json` y `web/content/cities.json` los venues prioridad A de `venues.md` (te lo pego abajo) con los campos mínimos que exige el schema de `web/src/lib/schema.ts`; marcá los textos editoriales como borrador (`draft: true`) y excluí de `sitemap.ts` e indexación los venues en borrador.
Tabla de venues nuevos (actualizada 27/10/2026 con la lista de recitales reales; foco en Buenos Aires, La Plata y Córdoba; Rosario en espera). Capacidades y direcciones marcadas "verificar" deben confirmarse antes de publicar.

| Prioridad | Venue | Ciudad | Dirección | Capacidad aprox. | Shows nov-26 a may-27 | Fuente agenda |
|---|---|---|---|---|---|---|
| A | Quality Arena | Córdoba | Cruz Roja Argentina 200 | ~6.000 (verificar) | 7 (Jesse & Joy, Paulo Londra, Reik, Montaner, Ha*Ash, Camila, Lebón y Aznar) | web Quality Center / TuEntrada |
| A | Hipódromo de La Plata | La Plata | Av. 44 y 115 (verificar) | festival (verificar) | 2 (Babasónicos, Lebón y Aznar) | prensa / ticketeras |
| A | Estadio Cubierto Malvinas Argentinas | CABA, La Paternal | Gutenberg 350 (verificar) | ~8.000 (verificar) | 2 (Hayley Williams, A Perfect Circle) | prensa / ticketeras |
| B | Club Ciudad de Buenos Aires | CABA, Núñez | Av. del Libertador 7501 | festival | 1 (Primavera Sound, 28-29/11) | primaverasound.com |
| B | Parque de la Ciudad | CABA, Villa Soldati | verificar | festival | 1 (Creamfields, 14/11) | ticketeras |
| B | Mandarine Park | CABA, Costanera Norte | verificar | festival | 1 (New Order, 1/12) | ticketeras |
| B | Estadio Obras Sanitarias | CABA, Núñez | Av. del Libertador 7395 (verificar) | ~4.700 | 1 (Daniel Caesar, 5/12) | All Access |
| B | La Bombonera, Racing, Independiente, Tecnópolis, Hipódromo de San Isidro | GBA/CABA | ver venues.md | estadio/festival | 0 confirmados ahora | ticketeras |
| C (en espera) | Estadio Marcelo Bielsa / Autódromo de Rosario | Rosario | verificar | estadio | 2 | prensa |

Nota: el "Malvinas Argentinas" de la tabla vieja (Mendoza) es otro estadio; el de los recitales es el cubierto de La Paternal, CABA. Teatros (Gran Rex) y salas chicas no se agregan como venue.

