# cercadelestadio.com: etapa 1

## Nicho
Hoteles cerca de estadios y venues de recitales en Argentina (afiliación Booking).
La demanda se ve en el autocompletado de Google para 13 de los 14 venues revisados. No hay volúmenes medidos. La competencia es media: Booking, Trip.com y algunos sitios afiliados hechos con plantilla.

## Booking afiliados
- El alta va por una red de afiliados (probablemente CJ para Argentina). Piden un sitio activo con contenido.
- Prohibido usar "booking" en el dominio. Prohibidos los iframes.
- Pagan del 25% al 40% de la comisión de Booking según las reservas del mes. El cobro es por transferencia, con un mínimo de 100 EUR.
- Mientras tanto: Travelpayouts o Agoda.

## Dominios .com sin registrar (RDAP, 27/10/2026)
cercadelestadio.com, hotelescercadelestadio.com, dormircercadelestadio.com, hotelporrecital.com
Los .com.ar no están verificados: revisarlos en nic.ar.

## Venues prioritarios
Monumental, Movistar Arena, Vélez, Kempes, Huracán, Estadio Único La Plata.

## Eventos confirmados (verificar antes de publicar)
- Ed Sheeran, Huracán, 29/11/2026
- Maná, Monumental, 10/12/2026
- Karol G, Monumental, 05/02/2027
- Foo Fighters, Monumental, 25/02/2027
- Montaner, marzo 2027 (Movistar Arena, Mendoza, Mar del Plata)
- U2, Monumental, 23 y 25/03/2027: sin confirmar

## Arquitectura
- /
- /ciudad/[slug]
- /estadio/[slug]
- /evento/[slug] (pasa a "finalizado" después de la fecha)
- /guia/[slug]
Cada página de evento se publica 4 a 6 semanas antes del show.
