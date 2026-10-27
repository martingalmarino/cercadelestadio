# Sistema de diseño

Señalética: Inter, grilla estricta, bandas casi negras, fondo gris claro y un solo verde de acento. Esquinas rectas. Sin sombras, sin degradados y sin emojis.

## Tokens

Definidos en `src/styles/tokens.css`. El hex vive solo ahí.

| Token | Valor | Uso |
| --- | --- | --- |
| `--c-ink-900` | `#141414` | Texto y bandas |
| `--c-ink-800` | `#1c1c1c` | Hero |
| `--c-gray-500` | `#5f5f5f` | Texto secundario (`--text-muted`) |
| `--c-gray-100` | `#ebebeb` | Fondo de página |
| `--c-white` | `#fff` | Superficie |
| `--text-inverse-muted` | `#b3b3b3` | Texto secundario sobre negro |
| `--c-green-600` | `#00704A` | Acento y acción (`--accent`) |
| `--c-green-700` | `#005c3c` | Hover y texto verde sobre fondo claro |
| `--c-green-300` | `#5fd3a3` | Acento sobre negro (`--accent-on-dark`) |
| `--focus` | `#0a84ff` | Anillo `:focus-visible` |
| `--font` | Inter | Única familia |
| `--fs-label` … `--fs-display` | 13px … 88px | Escala 1.25 |
| `--s-1` … `--s-9` | 4px … 96px | Espaciado en base 4 |
| `--container` | 1280px | Ancho máximo |
| `--gutter` | 16–40px | Margen lateral |
| `--tap` | 44px | Alto mínimo de un control |
| `--radius` | 0 | Sin esquinas redondeadas |

Breakpoints: `md` 767px y `lg` 1023px.

## Componentes

### `Button` y `ButtonLink`

Acción principal. `variant`: `primary` | `secondary` | `ghost`. `size`: `md` (44px) | `lg` (64px).

```tsx
<Button type="submit" size="lg">Buscar hoteles</Button>
<ButtonLink href="#dormir" size="lg">Ver hoteles para el 10/12</ButtonLink>
<ButtonLink affiliate subId={event.slug} query="Núñez, Buenos Aires">
  Ver disponibilidad
</ButtonLink>
```

`affiliate` abre el enlace de afiliado con `rel="sponsored nofollow"`.

### `ArrowLink`, `TextLink`, `ArrowLabel`

Navegación secundaria, sin relleno. `ArrowLink` es un subrayado verde, sin glifo de flecha. `ArrowLabel` es el mismo trazo cuando la fila entera ya es el enlace.

```tsx
<ArrowLink href={`/evento/${slug}`}>Ver hoteles</ArrowLink>
```

### `SectionBand`

Arranca cada bloque numerado. `index`, `title`, `titleId`, `meta?`. El título es un `h2`. `meta` se oculta bajo 767px: no pongas ahí la única explicación de la sección.

```tsx
<SectionBand index="01" title="Próximos eventos" titleId="titulo-eventos" meta="Actualizado 27/10/2026" />
```

### `SectionIntro` y `Note`

`SectionIntro` va debajo de la banda cuando hay una frase de contexto. `Note` es el estado vacío, sobre superficie blanca.

```tsx
<SectionIntro>Elegí el show. Hoteles ordenados a 1, 3 y 5 km, con tiempos a pie.</SectionIntro>
<Note>No hay shows anunciados en este estadio.</Note>
```

### `StatRow`

Cifras del hero. `items`: `{ label, value }[]`. Se acomoda a 2, 3, 4 o 5 ítems.

```tsx
<StatRow items={[{ label: "Estadios", value: 6 }, { label: "Radio", value: "1 · 3 · 5 km" }]} />
```

### `RowList` y `EventRow`

Listados de shows. No uses una tabla. La fila entera es el enlace.

```tsx
<RowList label="Próximos eventos">
  <EventRow
    href="/evento/mana-estadio-monumental"
    date="2026-12-10"
    title="Maná"
    subtitle="Estadio Monumental"
    place="Núñez"
    extra="42 hoteles a 3 km"
  />
</RowList>
```

`approximate` muestra el mes y la etiqueta «a confirmar».

### `VenueCells`

Grilla de recintos con bordes compartidos. `venues: Venue[]`.

### `HotelList`

Hoteles por distancia. `hotels`, `subId`, `place`. El botón es el enlace de afiliado.

### `VenueMap`

Mapa del estadio con el contorno real, anillos de 1 / 3 / 5 km y marcadores numerados. Primero se ve el plano estático. El mapa interactivo carga al tocar «Ver mapa interactivo» o al scrollear hasta el bloque. `HotelList` puede recibir `activeSlug` y `onActiveChange` para marcar la misma fila.

### `Countdown`

Bloque propio, con alto reservado para que el tick no mueva la página. `initialNow`, `target`, `finished`, `approximate`, `dateLabel`.

### `Timeline`

Pasos de llegada o del plan del día. `steps: TimelineStep[]`.

### `ClosureTable`

Única tabla del sitio. `rows`, `timeLabel?` (`"Desde"` o `"Horario"`). En mobile se desplaza en horizontal.

### `FaqList`

Preguntas en `<details>`. `items: { question, answer }[]`. La primera empieza abierta.

### `Breadcrumbs`

`items: { label, href? }[]`. Sin `href`, el ítem es la página actual.

### `Tag`

`tone`: `neutral` | `ok`. `ok` es el verde de «a confirmar».

## Cuándo usar cada pieza

- Banda (`SectionBand`) para cada sección numerada de una página. El `h1` queda en el hero; las bandas son `h2`.
- Intro (`SectionIntro`) si la sección necesita una frase antes del contenido. Si no hay esa frase, la banda alcanza.
- `Button` o `ButtonLink` para la acción de la pantalla: buscar, ver hoteles, ver disponibilidad.
- `ArrowLink` para seguir a otra ficha sin competir con esa acción.
- `EventRow` para shows. `ClosureTable` solo para cortes de calle.
- El verde es acción o acento. El texto corrido queda en negro o en el gris que pasa AA.
