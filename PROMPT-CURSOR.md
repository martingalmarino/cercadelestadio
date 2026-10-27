Armá un sitio Next.js (App Router, TypeScript, estático con ISR) llamado cercadelestadio.com, en español rioplatense (voseo): hoteles cerca de estadios y venues de recitales en Argentina, monetizado con afiliación hotelera.

Diseño: portá fielmente los HTML de /diseno-elegido (home, monumental, mana, s.css) y mirá las capturas en /mockups/alternativa-senaletica, incluida la de celular.
- Estilo señalética: solo Inter, grilla estricta, bandas casi negras, fondo gris claro, verde oscuro como único acento, esquinas rectas, líneas finas.
- Sin emojis, sin tarjetas redondeadas, sin gradientes, sin sombras.
- En celular, debajo de 640px, los hoteles van en filas apiladas.

Estructura:
- Datos en /content (JSON o MDX): venues, eventos, ciudades y hoteles de ejemplo marcados como tales.
- Rutas: /, /estadio/[slug], /evento/[slug], /ciudad/[slug].
- Datos de arranque: los venues y eventos que figuran en INVESTIGACION.md.
- Cada evento pasa a "finalizado" después de su fecha y enlaza al próximo evento del venue.
- Links de afiliado: un único helper que use la variable de entorno AFFILIATE_ID, con el evento como sub-id y rel="sponsored nofollow". Nunca usar "booking" en la marca. Aviso de afiliados en el footer.
- SEO: metadata por página, JSON-LD (Event, ItemList/Hotel, FAQPage, BreadcrumbList), sitemap y robots, canonical con la variable SITE_URL.
- Mapa: un SVG esquemático con anillos de 1, 3 y 5 km.
- Cuenta regresiva real en las páginas de evento.
- README que explique cómo sumar un venue o un evento y cómo deployar en Vercel.
