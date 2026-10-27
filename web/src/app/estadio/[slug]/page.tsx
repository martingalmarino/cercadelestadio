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
import { venueAnswer, venueFaqs } from "@/lib/answers";
import { formatCount, formatFullDate } from "@/lib/format";
import {
  alVenue,
  deVenue,
  enVenue,
  venueDescription,
  venueIntro,
  openGraphPage,
  venueTitle,
  withBrand,
} from "@/lib/seo";
import {
  breadcrumbList,
  faqPage,
  hotelItemList,
  stadium,
  stadiumId,
  webPage,
} from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import type { Metadata } from "next";
import Link from "next/link";
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
  const title = withBrand(venueTitle(venue));
  const description = venueDescription(venue);
  const path = `/estadio/${venue.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraphPage(title, description, path),
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
  const faqs = venueFaqs(venue, hotels);
  const caption = `Distancias a ${venue.seoName}: kilómetros, minutos a pie y minutos en auto.`;

  return (
    <main>
      <JsonLd
        data={[
          webPage({
            path: `/estadio/${venue.slug}`,
            name: venueTitle(venue),
            dateModified: venue.updatedAt,
            aboutId: stadiumId(venue),
          }),
          breadcrumbList([
            { name: "Inicio", path: "/" },
            ...(city
              ? [{ name: city.name, path: `/ciudad/${city.slug}` }]
              : []),
            { name: venue.seoName, path: `/estadio/${venue.slug}` },
          ]),
          stadium(venue),
          hotelItemList(`Hoteles cerca de ${venue.seoName}`, hotels),
          faqPage(faqs, `/estadio/${venue.slug}`),
        ]}
      />
      <section className={`${frame.hero} inverse`}>
        <div className="container">
          <Breadcrumbs
            items={[
              { href: "/", label: "Inicio" },
              { href: "/#estadios", label: "Estadios" },
              ...(city
                ? [{ href: `/ciudad/${city.slug}`, label: city.name }]
                : [{ label: venue.name }]),
            ]}
          />
          <h1 className={frame.venueTitle}>{venueTitle(venue)}</h1>
          {venue.updatedAt ? (
            <time className={frame.updated} dateTime={venue.updatedAt}>
              Actualizado el {formatFullDate(venue.updatedAt)}
            </time>
          ) : null}
          <p className={frame.answer}>{venueAnswer(venue, hotels)}</p>
          <p className={frame.lede}>{venueIntro(venue)}</p>
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
        <SectionBand
          index="01"
          title={`${venueTitle(venue)} por distancia`}
          titleId="hoteles"
        />
        <div className="container">
          <SectionIntro>
            Distancias en línea recta. Precios y disponibilidad en Booking.
            {city ? (
              <>
                {" "}
                <Link href={`/ciudad/${city.slug}`}>
                  Recitales y estadios en {city.name}
                </Link>
              </>
            ) : null}
          </SectionIntro>
          <div className={styles.stack}>
            <VenueHotels
              venue={{ name: venue.name, lat: venue.lat, lng: venue.lng }}
              outline={getVenueOutline(venue.slug)}
              hotels={hotels}
              subId={upcoming[0]?.slug ?? venue.slug}
              place={place}
              caption={caption}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="barrios">
        <SectionBand
          index="02"
          title={`Barrios para dormir cerca ${deVenue(venue)}`}
          titleId="barrios"
        />
        <div className={`container ${styles.block}`}>
          <div className={styles.areas}>
            {venue.neighborhoods.map((area) => (
              <article key={area.name}>
                <span className="label">{area.range}</span>
                <h3>Hoteles en {area.name}</h3>
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
        <SectionBand
          index="03"
          title={`Cómo llegar ${alVenue(venue)}`}
          titleId="llegar"
        />
        <div className="container">
          <Timeline steps={venue.transit} />
        </div>
      </section>

      <section aria-labelledby="volver">
        <SectionBand
          index="04"
          title={`Cómo volver ${deVenue(venue)} después del show`}
          titleId="volver"
        />
        <div className="container">
          <div className={styles.advice}>
            <span className="label">{venue.returnAdvice.label}</span>
            <h3>{venue.returnAdvice.title}</h3>
            <p>{venue.returnAdvice.text}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="cortes">
        <SectionBand index="05" title="Cortes de calle el día del evento" titleId="cortes" />
        <div className="container">
          <SectionIntro>Días de evento.</SectionIntro>
          <ClosureTable rows={venue.closures} />
        </div>
      </section>

      <section aria-labelledby="proximos">
        <SectionBand
          index="06"
          title={`Próximos eventos ${enVenue(venue)}`}
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
        <SectionBand index="07" title="Preguntas frecuentes" titleId="faq" />
        <div className={`container ${styles.block}`}>
          <FaqList items={faqs} />
        </div>
      </section>
    </main>
  );
}
