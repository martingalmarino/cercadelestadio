import { Breadcrumbs } from "@/components/breadcrumbs";
import { ClosureTable } from "@/components/closure-table";
import { EventRow } from "@/components/event-row";
import { FaqList } from "@/components/faq-list";
import frame from "@/components/hero-frame.module.css";
import { VenueHotels } from "@/components/map/venue-hotels";
import { JsonLd } from "@/components/json-ld";
import { RowList } from "@/components/row-list";
import { SectionBand } from "@/components/section-band";
import { Note, SectionIntro } from "@/components/section-intro";
import { StatRow } from "@/components/stat-row";
import { Timeline } from "@/components/timeline";
import {
  getCity,
  getVenue,
  getVenueOutline,
  getVenues,
  hotelsFor,
  upcomingForVenue,
} from "@/lib/content";
import { formatCount, withArticle } from "@/lib/format";
import {
  breadcrumbList,
  faqPage,
  hotelItemList,
  venueEventList,
} from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

export function generateStaticParams() {
  return getVenues().map((venue) => ({ slug: venue.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/estadio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenue(slug);
  if (!venue) return { title: "Estadio" };
  return {
    title: venue.name,
    description: `Hoteles por distancia, cómo llegar y cómo volver de ${venue.name}. ${venue.address}`,
    alternates: { canonical: `/estadio/${venue.slug}` },
  };
}

export default async function StadiumPage(props: PageProps<"/estadio/[slug]">) {
  const { slug } = await props.params;
  const venue = getVenue(slug);
  if (!venue) notFound();

  const city = getCity(venue.citySlug);
  const hotels = hotelsFor(venue.slug);
  const now = await getCachedNow();
  const upcoming = upcomingForVenue(venue.slug, now);
  const place = city?.name ?? venue.neighborhood;

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbList([
            { name: "Inicio", path: "/" },
            ...(city
              ? [{ name: city.name, path: `/ciudad/${city.slug}` }]
              : []),
            { name: venue.name, path: `/estadio/${venue.slug}` },
          ]),
          hotelItemList(`Hoteles cerca de ${venue.name}`, hotels, place),
          faqPage(venue.faq),
          ...(upcoming.length > 0
            ? [venueEventList(upcoming, venue.name)]
            : []),
        ]}
      />
      <section className={`${frame.hero} inverse`}>
        <div className="container">
          <Breadcrumbs
            items={[
              { href: "/", label: "Inicio" },
              { href: "/#estadios", label: "Estadios" },
              { label: city?.name ?? venue.name },
            ]}
          />
          <h1 className={frame.venueTitle}>{venue.name}</h1>
          <p className={frame.lede}>{venue.address}</p>
          <StatRow
            items={[
              { label: "Capacidad", value: formatCount(venue.capacity) },
              { label: "Barrio", value: venue.neighborhood },
              { label: "Hoteles a 3 km", value: venue.hotelsWithin3km },
              {
                label: "Próximos eventos",
                value: <span className={frame.accent}>{upcoming.length}</span>,
              },
              { label: venue.accessLabel, value: venue.accessValue },
            ]}
          />
        </div>
      </section>

      <section aria-labelledby="hoteles">
        <SectionBand index="01" title="Hoteles por distancia" titleId="hoteles" />
        <div className="container">
          <SectionIntro>Precios de ejemplo, noche estándar.</SectionIntro>
          <div className={styles.stack}>
            <VenueHotels
              venue={{ name: venue.name, lat: venue.lat, lng: venue.lng }}
              outline={getVenueOutline(venue.slug)}
              hotels={hotels}
              subId={upcoming[0]?.slug ?? venue.slug}
              place={place}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="barrios">
        <SectionBand index="02" title="Barrios recomendados" titleId="barrios" />
        <div className={`container ${styles.block}`}>
          <div className={styles.areas}>
            {venue.neighborhoods.map((area) => (
              <article key={area.name}>
                <span className="label">{area.range}</span>
                <h3>{area.name}</h3>
                <p>{area.summary}</p>
                <p className={styles.note}>
                  <b>A favor:</b> {area.pros}. <b>En contra:</b> {area.cons}.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="llegar">
        <SectionBand index="03" title="Cómo llegar y volver" titleId="llegar" />
        <div className="container">
          <div className={styles.split}>
            <Timeline steps={venue.transit} />
            <div className={styles.advice}>
              <span className="label">{venue.returnAdvice.label}</span>
              <h3>{venue.returnAdvice.title}</h3>
              <p>{venue.returnAdvice.text}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="cortes">
        <SectionBand index="04" title="Cortes y seguridad" titleId="cortes" />
        <div className="container">
          <SectionIntro>Días de evento.</SectionIntro>
          <ClosureTable rows={venue.closures} />
        </div>
      </section>

      <section aria-labelledby="proximos">
        <SectionBand
          index="05"
          title={`Próximos eventos en ${withArticle(venue.name)}`}
          titleId="proximos"
        />
        <div className={`container ${styles.block}`}>
          {upcoming.length === 0 ? (
            <Note>No hay shows anunciados en este estadio.</Note>
          ) : (
            <RowList label={`Próximos eventos en ${venue.name}`}>
              {upcoming.map((event) => (
                <EventRow
                  key={event.slug}
                  href={`/evento/${event.slug}`}
                  date={event.date}
                  approximate={!event.dateExact}
                  title={event.artist}
                  subtitle={event.type}
                  actionLabel="Ver hoteles"
                />
              ))}
            </RowList>
          )}
        </div>
      </section>

      <section aria-labelledby="faq">
        <SectionBand index="06" title="Preguntas frecuentes" titleId="faq" />
        <div className={`container ${styles.block}`}>
          <FaqList items={venue.faq} />
        </div>
      </section>
    </main>
  );
}
