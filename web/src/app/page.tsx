import { JsonLd } from "@/components/json-ld";
import { PageFallback } from "@/components/page-fallback";
import { RowList } from "@/components/row-list";
import { EventRow } from "@/components/event-row";
import { SectionBand } from "@/components/section-band";
import { Note, SectionIntro } from "@/components/section-intro";
import { StatRow } from "@/components/stat-row";
import { Button } from "@/components/ui/button";
import { ArrowLink } from "@/components/ui/text-link";
import { VenueCells } from "@/components/venue-cells";
import { getCity, getEvents, getVenue, getVenues } from "@/lib/content";
import { upcomingEvents } from "@/lib/events";
import { countdownTarget } from "@/lib/format";
import { breadcrumbList, eventItemList } from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import type { ShowEvent, Venue } from "@/lib/types";
import frame from "@/components/hero-frame.module.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import styles from "./home.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const steps = [
  {
    n: "1",
    title: "Elegí el evento",
    text: "Buscá el show o el estadio al que vas.",
  },
  {
    n: "2",
    title: "Compará por distancia",
    text: "Hoteles ordenados a 1, 3 y 5 km, con tiempos a pie.",
  },
  {
    n: "3",
    title: "Reservá con el enlace",
    text: "Ves disponibilidad y el precio final en el sitio del alojamiento.",
  },
] as const;

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function textOf(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

function fold(value: string) {
  return value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matches(value: string, query: string) {
  return fold(value).includes(query);
}

function heroDate(event: ShowEvent) {
  const [year, month, day] = event.date.split("-");
  if (!event.dateExact) return `${MONTHS[Number(month) - 1]} ${year}`;
  return `${day}.${month}`;
}

function eventMatches(event: ShowEvent, query: string, fecha: string) {
  if (fecha && event.date !== fecha) return false;
  if (!query) return true;
  const venue = event.venueSlug ? getVenue(event.venueSlug) : null;
  const city = getCity(event.citySlug);
  return (
    matches(event.artist, query) ||
    matches(venue?.name ?? "", query) ||
    matches(venue?.neighborhood ?? "", query) ||
    matches(city?.name ?? "", query)
  );
}

function venueMatches(venue: Venue, query: string) {
  if (!query) return true;
  const city = getCity(venue.citySlug);
  return (
    matches(venue.name, query) ||
    matches(venue.neighborhood, query) ||
    matches(city?.name ?? "", query)
  );
}

export default function Home(props: PageProps<"/">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <HomeContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const params = await searchParams;
  const query = fold(textOf(params.q));
  const fecha = textOf(params.fecha);
  const now = await getCachedNow();
  const upcoming = upcomingEvents(getEvents(), now);
  const next = upcoming[0];
  const events = upcoming.filter((event) => eventMatches(event, query, fecha));
  const venues = getVenues().filter((venue) => venueMatches(venue, query));
  const citiesWithVenue = new Set(getVenues().map((venue) => venue.citySlug)).size;
  const searching = query.length > 0 || fecha.length > 0;
  const nothing = searching && events.length === 0 && venues.length === 0;

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbList([{ name: "Inicio", path: "/" }]),
          eventItemList(
            "Próximos eventos",
            upcoming.map((event) => ({
              name: event.artist,
              path: `/evento/${event.slug}`,
              startDate: countdownTarget(event),
            })),
          ),
        ]}
      />
      <section className={`${frame.hero} inverse`}>
        <div className={`container grid ${styles.grid}`}>
          <p className={`label inverse ${styles.kicker}`}>
            Hoteles cerca de estadios · Argentina
          </p>
          <h1 className={styles.title}>Dormí cerca del show.</h1>
          <p className={styles.lede}>
            Hoteles por distancia, cómo llegar y cómo volver, para cada estadio
            y recital del país.
          </p>
          {next ? (
            <div className={styles.next}>
              <span className="label">Próximo show</span>
              <div className={styles.date}>{heroDate(next)}</div>
              <div className={styles.artist}>{next.artist}</div>
              <ArrowLink href={`/evento/${next.slug}`}>Ver hoteles</ArrowLink>
            </div>
          ) : null}
          <form className={styles.search} role="search" action="/" method="get">
            <label>
              <span>Evento o estadio</span>
              <input
                name="q"
                type="search"
                placeholder="Buscá un evento o estadio"
                defaultValue={textOf(params.q)}
              />
            </label>
            <label>
              <span>Fecha</span>
              <input name="fecha" type="date" defaultValue={fecha || undefined} />
            </label>
            <Button type="submit" size="lg">
              Buscar hoteles
            </Button>
          </form>
          <div className={styles.stats}>
            <StatRow
              items={[
                { label: "Estadios", value: getVenues().length },
                { label: "Próximos shows", value: upcoming.length },
                { label: "Ciudades", value: citiesWithVenue },
                { label: "Radio", value: "1 · 3 · 5 km" },
              ]}
            />
          </div>
        </div>
      </section>

      <section id="eventos" aria-labelledby="titulo-eventos">
        <SectionBand
          index="01"
          title="Próximos eventos"
          titleId="titulo-eventos"
          meta="Actualizado 27/10/2026"
        />
        <div className="container">
          <SectionIntro>
            Elegí el show. Hoteles ordenados a 1, 3 y 5 km, con tiempos a pie.
          </SectionIntro>
          {events.length === 0 ? (
            <Note>
              {nothing
                ? "No hay eventos ni estadios con esa búsqueda."
                : "No hay shows para esa búsqueda."}
            </Note>
          ) : (
            <RowList label="Próximos eventos">
              {events.map((event) => {
                const venue = event.venueSlug ? getVenue(event.venueSlug) : null;
                const city = getCity(event.citySlug);
                return (
                  <EventRow
                    key={event.slug}
                    href={`/evento/${event.slug}`}
                    date={event.date}
                    approximate={!event.dateExact}
                    title={event.artist}
                    subtitle={venue?.name ?? "Recinto a confirmar"}
                    place={venue?.neighborhood ?? city?.name}
                    extra={
                      venue ? `${venue.hotelsWithin3km} hoteles a 3 km` : undefined
                    }
                  />
                );
              })}
            </RowList>
          )}
        </div>
      </section>

      <section id="estadios" aria-labelledby="titulo-estadios">
        <SectionBand
          index="02"
          title="Estadios y recintos"
          titleId="titulo-estadios"
          meta={`${venues.length} recintos`}
        />
        <div className={`container ${styles.block}`}>
          {venues.length === 0 ? (
            <Note>No hay estadios con esa búsqueda.</Note>
          ) : (
            <VenueCells venues={venues} />
          )}
        </div>
      </section>

      <section id="como-funciona" aria-labelledby="titulo-como">
        <SectionBand index="03" title="Cómo funciona" titleId="titulo-como" />
        <div className={`container ${styles.block}`}>
          <div className={styles.steps}>
            {steps.map((step) => (
              <div key={step.n}>
                <b>{step.n}</b>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
          <p className={styles.disclosure}>
            Algunos enlaces son de afiliado. Si reservás a través de ellos
            podemos recibir una comisión, sin costo extra para vos.
          </p>
        </div>
      </section>
    </main>
  );
}
