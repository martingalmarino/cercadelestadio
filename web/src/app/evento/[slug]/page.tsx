import { Breadcrumbs } from "@/components/breadcrumbs";
import { ClosureTable } from "@/components/closure-table";
import { Countdown } from "@/components/countdown";
import { EventRow } from "@/components/event-row";
import frame from "@/components/hero-frame.module.css";
import { HotelList } from "@/components/hotel-list";
import { JsonLd } from "@/components/json-ld";
import { RowList } from "@/components/row-list";
import { SectionBand } from "@/components/section-band";
import { FaqList } from "@/components/faq-list";
import { Note, SectionIntro } from "@/components/section-intro";
import { StatRow } from "@/components/stat-row";
import { Timeline } from "@/components/timeline";
import { ArrowLabel, TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button";
import {
  eventsForCity,
  eventsForVenue,
  getCity,
  getEvent,
  getEvents,
  getVenue,
  hotelsFor,
  minNightlyPrice,
} from "@/lib/content";
import { isFinished, nextVenueEvent } from "@/lib/events";
import {
  countdownTarget,
  eventDateLabel,
  formatArs,
  formatDayMonth,
  formatFullDate,
  monthName,
  weekdayName,
  withArticle,
} from "@/lib/format";
import {
  breadcrumbList,
  concertEvent,
  eventId,
  faqPage,
  hotelItemList,
  stadium,
  stadiumId,
  webPage,
} from "@/lib/structured-data";
import {
  eventDescription,
  eventPlace,
  eventTitle,
  openGraphPage,
  venueTitle,
  withBrand,
} from "@/lib/seo";
import { eventAnswer, eventFaqs } from "@/lib/answers";
import { getCachedNow } from "@/lib/time";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

const tips = [
  "Reservá con cancelación gratuita: los precios suben en las últimas semanas.",
  "Si vas en grupo, un apart en el barrio del estadio puede salir más barato por persona.",
  "Cargá la SUBE antes del día del show.",
];

export function generateStaticParams() {
  return getEvents().map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/evento/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Evento" };
  const venue = event.venueSlug ? getVenue(event.venueSlug) : null;
  const cityName = getCity(event.citySlug)?.name ?? "Argentina";
  const title = withBrand(eventTitle(event, venue, cityName));
  const description = eventDescription(event, venue, cityName);
  const path = `/evento/${event.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraphPage(title, description, path),
  };
}

export default async function EventPage(props: PageProps<"/evento/[slug]">) {
  const { slug } = await props.params;
  const event = getEvent(slug);
  if (!event) notFound();

  const venue = event.venueSlug ? getVenue(event.venueSlug) : null;
  const city = getCity(event.citySlug);
  const now = await getCachedNow();
  const finished = isFinished(event.date, now);
  const next = nextVenueEvent(getEvents(), event, now);
  const hotels = venue ? hotelsFor(venue.slug) : [];
  const minPrice = venue ? minNightlyPrice(venue.slug) : null;
  const closures = event.closures ?? venue?.closures ?? [];
  const siblings = (
    venue ? eventsForVenue(venue.slug) : eventsForCity(event.citySlug)
  ).filter((item) => item.slug !== event.slug);
  const when = event.dateExact
    ? formatFullDate(event.date)
    : monthName(event.date);
  const schedule =
    event.doors && event.showTime
      ? `Puertas ${event.doors} · Show ${event.showTime}`
      : "Horario a confirmar";
  const placeLine = venue ? venue.address : "Recinto a confirmar";
  const fechaCta = event.dateExact
    ? `el ${formatDayMonth(event.date)}`
    : monthName(event.date);

  let band = 1;
  const index = () => String(band++).padStart(2, "0");

  const placeName = venue
    ? withArticle(venue.name)
    : (city?.name ?? "Argentina");
  const place = eventPlace(venue, city?.name ?? "");
  const faqs = eventFaqs(event, venue, place, hotels);
  const caption = venue
    ? `Distancias a ${venue.seoName}: kilómetros, minutos a pie y minutos en auto.`
    : "Distancias a confirmar.";
  const musicEvent = concertEvent({
    event,
    venue,
    cityName: city?.name ?? "Argentina",
    description: `Dónde dormir para ver a ${event.artist} en ${placeName}.`,
  });

  return (
    <main>
      <JsonLd
        data={[
          webPage({
            path: `/evento/${event.slug}`,
            name: eventTitle(event, venue, city?.name ?? "Argentina"),
            dateModified: event.updatedAt,
            aboutId: musicEvent
              ? eventId(event)
              : venue
                ? stadiumId(venue)
                : undefined,
          }),
          breadcrumbList([
            { name: "Inicio", path: "/" },
            ...(venue
              ? [{ name: venue.seoName, path: `/estadio/${venue.slug}` }]
              : city
                ? [{ name: city.name, path: `/ciudad/${city.slug}` }]
                : []),
            { name: event.artist, path: `/evento/${event.slug}` },
          ]),
          musicEvent,
          !musicEvent && venue ? stadium(venue) : null,
          hotelItemList(`Dónde dormir para ${event.artist}`, hotels),
          faqPage(faqs, `/evento/${event.slug}`),
        ]}
      />
      <section className={`${frame.hero} inverse`}>
        <div className="container">
          <Breadcrumbs
            items={[
              { href: "/", label: "Inicio" },
              { href: "/#eventos", label: "Eventos" },
              venue
                ? { href: `/estadio/${venue.slug}`, label: venue.name }
                : {
                    href: city ? `/ciudad/${city.slug}` : "/",
                    label: city?.name ?? "Argentina",
                  },
            ]}
          />
          <div className={styles.sheet}>
            <div className={styles.date}>
              <div className={styles.kicker}>
                {event.dateExact ? weekdayName(event.date) : "Fecha a confirmar"}
              </div>
              <div className={styles.day}>
                {event.dateExact ? formatDayMonth(event.date) : monthName(event.date)}
              </div>
              <div className={styles.year}>{event.date.slice(0, 4)}</div>
            </div>
            <div className={styles.copy}>
              <h1>
                {event.artist} en {place}: dónde dormir
              </h1>
              {event.updatedAt ? (
                <time className={frame.updated} dateTime={event.updatedAt}>
                  Actualizado el {formatFullDate(event.updatedAt)}
                </time>
              ) : null}
              <p className={frame.answer}>
                {eventAnswer(event, venue, city?.name ?? "Argentina", hotels)}
              </p>
              <p>
                {event.dateExact
                  ? formatFullDate(event.date)
                  : `En ${monthName(event.date)} de ${event.date.slice(0, 4)}`}
                {" · "}
                {schedule} · {placeLine}
              </p>
            </div>
          </div>
          <div className={styles.cta}>
            <ButtonLink href="#dormir" size="lg">
              Ver hoteles para {fechaCta}
            </ButtonLink>
          </div>
          <Countdown
            initialNow={now}
            target={countdownTarget(event)}
            finished={finished}
            approximate={!event.dateExact}
            dateLabel={eventDateLabel(event.date, event.dateExact)}
          />
          <StatRow
            items={[
              {
                label: "Hoteles a 3 km",
                value: venue ? venue.hotelsWithin3km : "—",
              },
              {
                label: "Desde / noche",
                value: minPrice === null ? "—" : formatArs(minPrice),
              },
            ]}
          />
          {finished ? (
            <p className={styles.finished}>
              Este show ya pasó.{" "}
              {next ? (
                <TextLink href={`/evento/${next.slug}`}>
                  Próximo en {venue ? "este estadio" : "esta ciudad"}: {next.artist}
                </TextLink>
              ) : (
                "No hay otro evento anunciado en este lugar."
              )}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="dormir">
        <SectionBand
          index={index()}
          title={
            venue
              ? `${venueTitle(venue)} por distancia`
              : event.dateExact
                ? `Dónde dormir la noche del ${formatDayMonth(event.date)}`
                : `Dónde dormir en ${when}`
          }
          titleId="dormir"
        />
        <div className="container">
          {hotels.length > 0 ? (
            <>
              <SectionIntro>
                Precios de ejemplo para el{" "}
                {eventDateLabel(event.date, event.dateExact)}
              </SectionIntro>
              <HotelList
                hotels={hotels}
                subId={event.slug}
                place={city?.name ?? venue?.neighborhood ?? ""}
                caption={caption}
              />
            </>
          ) : (
            <Note>
              El recinto en {city?.name} todavía no está confirmado, así que no
              hay una lista de hoteles. Cuando haya estadio, la guía va a
              ordenarlos por distancia.
            </Note>
          )}
        </div>
      </section>

      {event.plan ? (
        <section aria-labelledby="plan">
          <SectionBand
            index={index()}
            title="Plan del día"
            titleId="plan"
            meta={
              event.dateExact
                ? `${weekdayName(event.date)} ${formatFullDate(event.date)}`
                : undefined
            }
          />
          <div className={`container ${styles.block}`}>
            <Timeline steps={event.plan} />
          </div>
        </section>
      ) : null}

      {closures.length > 0 ? (
        <section aria-labelledby="cortes-evento">
          <SectionBand
            index={index()}
            title="Cortes de calle el día del evento"
            titleId="cortes-evento"
          />
          <div className={`container ${styles.block}`}>
            <ClosureTable rows={closures} timeLabel="Horario" />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="faq-evento">
        <SectionBand index={index()} title="Preguntas frecuentes" titleId="faq-evento" />
        <div className={`container ${styles.block}`}>
          <FaqList items={faqs} />
        </div>
      </section>

      <section aria-labelledby="consejos">
        <SectionBand index={index()} title="Consejos" titleId="consejos" />
        <div className={`container ${styles.block}`}>
          <ol className={styles.tips}>
            {tips.map((tip, tipIndex) => (
              <li key={tip}>
                <b>{tipIndex + 1}</b>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="mas">
        <SectionBand
          index={index()}
          title={
            venue
              ? `Más en ${withArticle(venue.name)}`
              : `Más en ${city?.name ?? "esta ciudad"}`
          }
          titleId="mas"
        />
        <div className={`container ${styles.block}`}>
          {venue ? (
            <Link className={styles.guide} href={`/estadio/${venue.slug}`}>
              <span>
                <b>{venueTitle(venue)}</b>
                <small>Barrios, transporte y preguntas frecuentes</small>
              </span>
              <ArrowLabel>Ver estadio</ArrowLabel>
            </Link>
          ) : city ? (
            <Link className={styles.guide} href={`/ciudad/${city.slug}`}>
              <span>
                <b>{city.name}</b>
                <small>Recinto a confirmar</small>
              </span>
              <ArrowLabel>Ver ciudad</ArrowLabel>
            </Link>
          ) : null}
          {siblings.length > 0 ? (
            <RowList label="Otros eventos">
              {siblings.map((item) => (
                <EventRow
                  key={item.slug}
                  href={`/evento/${item.slug}`}
                  date={item.date}
                  approximate={!item.dateExact}
                  title={item.artist}
                  subtitle={item.type}
                  actionLabel="Ver hoteles"
                />
              ))}
            </RowList>
          ) : null}
        </div>
      </section>
    </main>
  );
}
