import frame from "@/components/hero-frame.module.css";
import {
  FechaField,
  HomeEventList,
  HomeSearchSync,
  HomeVenueSection,
  type HomeEventCard,
  type HomeVenueCard,
} from "@/components/home-search";
import { JsonLd } from "@/components/json-ld";
import { SectionBand } from "@/components/section-band";
import { SectionIntro } from "@/components/section-intro";
import { StatRow } from "@/components/stat-row";
import { Button } from "@/components/ui/button";
import { ArrowLink } from "@/components/ui/text-link";
import { getCity, getEvents, getVenue, getVenues } from "@/lib/content";
import { upcomingEvents } from "@/lib/events";
import { eventItemList, webPage } from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import type { ShowEvent } from "@/lib/types";
import type { Metadata } from "next";
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

function fold(value: string) {
  return value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function heroDate(event: ShowEvent) {
  const [year, month, day] = event.date.split("-");
  if (!event.dateExact) return `${MONTHS[Number(month) - 1]} ${year}`;
  return `${day}.${month}`;
}

export default async function Home() {
  const now = await getCachedNow();
  const upcoming = upcomingEvents(getEvents(), now);
  const next = upcoming[0];
  const events: HomeEventCard[] = upcoming.map((event) => {
    const venue = event.venueSlug ? getVenue(event.venueSlug) : null;
    const city = getCity(event.citySlug);
    return {
      slug: event.slug,
      date: event.date,
      dateExact: event.dateExact,
      artist: event.artist,
      subtitle: venue?.name ?? "Recinto a confirmar",
      place: venue?.neighborhood ?? city?.name,
      extra: venue ? `${venue.hotelsWithin3km} hoteles a 3 km` : undefined,
      haystack: fold(
        [event.artist, venue?.name, venue?.neighborhood, city?.name]
          .filter(Boolean)
          .join(" "),
      ),
    };
  });
  const venues: HomeVenueCard[] = getVenues().map((venue) => {
    const city = getCity(venue.citySlug);
    return {
      ...venue,
      haystack: fold([venue.name, venue.neighborhood, city?.name].filter(Boolean).join(" ")),
    };
  });
  const citiesWithVenue = new Set(getVenues().map((venue) => venue.citySlug)).size;

  return (
    <main>
      <JsonLd
        data={[
          webPage({
            path: "/",
            name: "Hoteles cerca de estadios y recitales en Argentina",
          }),
          eventItemList(
            "Próximos eventos",
            upcoming.map((event) => ({
              name: event.artist,
              path: `/evento/${event.slug}`,
            })),
          ),
        ]}
      />
      <section className={`${frame.hero} inverse`}>
        <div className={`container grid ${styles.grid}`}>
          <p className={`label inverse ${styles.kicker}`}>
            Hoteles cerca de estadios · Argentina
          </p>
          <div className={styles.copy}>
            <h1 className={styles.title}>Dormí cerca del show.</h1>
            <p className={styles.lede}>
              Hoteles a 1, 3 y 5 km del estadio, con subte, tren o colectivo
              según el recinto. Cómo llegar, cómo volver y dónde dormir.
            </p>
          </div>
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
              <input name="q" type="search" placeholder="Buscá un evento o estadio" />
            </label>
            <FechaField />
            <Button type="submit" size="lg">
              Buscar hoteles
            </Button>
          </form>
          <HomeSearchSync />
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
          <HomeEventList events={events} venues={venues} />
        </div>
      </section>

      <HomeVenueSection venues={venues} />

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
          <p>
            <ArrowLink href="/como-funciona">Cómo medimos las distancias</ArrowLink>
          </p>
        </div>
      </section>
    </main>
  );
}
