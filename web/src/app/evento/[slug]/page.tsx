import { Countdown } from "@/components/countdown";
import { JsonLd } from "@/components/json-ld";
import { HotelTable } from "@/components/hotel-table";
import { SectionBand } from "@/components/section-band";
import { Timeline } from "@/components/timeline";
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
  hotelItemList,
} from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import { PageFallback } from "@/components/page-fallback";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

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
  const place = venue
    ? withArticle(venue.name)
    : (getCity(event.citySlug)?.name ?? "Argentina");
  return {
    title: `${event.artist} en ${place}`,
    description: `Dónde dormir para ver a ${event.artist} en ${place}. Hoteles por distancia, con precios de ejemplo.`,
    alternates: { canonical: `/evento/${event.slug}` },
  };
}

export default function EventPage(props: PageProps<"/evento/[slug]">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <EventContent params={props.params} />
    </Suspense>
  );
}

async function EventContent({
  params,
}: {
  params: PageProps<"/evento/[slug]">["params"];
}) {
  const { slug } = await params;
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
  const schedule = event.doors && event.showTime
    ? `Puertas ${event.doors} · Show ${event.showTime}`
    : "Horario a confirmar";
  const placeLine = venue ? venue.address : "Recinto a confirmar";

  let band = 1;
  const index = () => String(band++).padStart(2, "0");

  const placeName = venue
    ? withArticle(venue.name)
    : (city?.name ?? "Argentina");

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbList([
            { name: "Inicio", path: "/" },
            ...(venue
              ? [{ name: venue.name, path: `/estadio/${venue.slug}` }]
              : city
                ? [{ name: city.name, path: `/ciudad/${city.slug}` }]
                : []),
            { name: event.artist, path: `/evento/${event.slug}` },
          ]),
          concertEvent({
            name: `${event.artist} en ${placeName}`,
            path: `/evento/${event.slug}`,
            startDate: countdownTarget(event),
            description: `Dónde dormir para ver a ${event.artist} en ${placeName}.`,
            finished,
            venue,
            cityName: city?.name ?? "Argentina",
            artist: event.artist,
          }),
          ...(hotels.length > 0
            ? [
                hotelItemList(
                  `Dónde dormir para ${event.artist}`,
                  hotels,
                  city?.name ?? "",
                ),
              ]
            : []),
        ]}
      />
      <section className="hero">
        <div className="w">
          <p className="crumb">
            <Link href="/">Inicio</Link>
            {" / "}
            <Link href="/#eventos">Eventos</Link>
            {venue ? (
              <>
                {" / "}
                <Link href={`/estadio/${venue.slug}`} prefetch={true}>
                  {venue.name}
                </Link>
              </>
            ) : city ? (
              <>
                {" / "}
                <Link href={`/ciudad/${city.slug}`} prefetch={true}>
                  {city.name}
                </Link>
              </>
            ) : null}
          </p>
          <div className="event-head">
            <div className="date-card">
              <div className="lab">
                {event.dateExact ? weekdayName(event.date) : "Fecha a confirmar"}
              </div>
              <div className="day">
                {event.dateExact ? formatDayMonth(event.date) : monthName(event.date)}
              </div>
              <div className="year">{event.date.slice(0, 4)}</div>
            </div>
            <div>
              <h1>
                {event.artist} en {venue ? withArticle(venue.name) : (city?.name ?? "")}
              </h1>
              <p className="sub">
                {schedule} · {placeLine}
              </p>
            </div>
          </div>
          <div className="facts">
            <Countdown
              target={countdownTarget(event)}
              finished={finished}
              approximate={!event.dateExact}
              dateLabel={eventDateLabel(event.date, event.dateExact)}
            />
            <div>
              <small>Hoteles a 3 km</small>
              <b>{venue ? venue.hotelsWithin3km : "—"}</b>
            </div>
            <div>
              <small>Desde / noche</small>
              <b>{minPrice === null ? "—" : formatArs(minPrice)}</b>
            </div>
          </div>
          {finished ? (
            <p className="sub next-show">
              Este show ya pasó.
              {next ? (
                <>
                  {" "}
                  <Link href={`/evento/${next.slug}`} prefetch={true}>
                    Próximo en {venue ? "este estadio" : "esta ciudad"}:{" "}
                    {next.artist} →
                  </Link>
                </>
              ) : (
                " No hay otro evento anunciado en este lugar."
              )}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="dormir">
        <SectionBand
          index={index()}
          title={
            event.dateExact
              ? `Dónde dormir la noche del ${formatDayMonth(event.date)}`
              : `Dónde dormir en ${when}`
          }
          titleId="dormir"
          meta={
            hotels.length > 0
              ? `Precios de ejemplo para el ${eventDateLabel(event.date, event.dateExact)}`
              : undefined
          }
        />
        <div className="w">
          {hotels.length > 0 ? (
            <HotelTable
              hotels={hotels}
              subId={event.slug}
              place={city?.name ?? venue?.neighborhood ?? ""}
            />
          ) : (
            <p className="line">
              El recinto en {city?.name} todavía no está confirmado, así que no
              hay una lista de hoteles. Cuando haya estadio, la guía va a
              ordenarlos por distancia.
            </p>
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
          <div className="w">
            <Timeline steps={event.plan} />
          </div>
        </section>
      ) : null}

      {closures.length > 0 ? (
        <section aria-labelledby="cortes-evento">
          <SectionBand index={index()} title="Cortes de calle" titleId="cortes-evento" />
          <div className="w">
            <table>
              <thead>
                <tr>
                  <th scope="col">Horario</th>
                  <th scope="col">Corte</th>
                  <th scope="col">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {closures.map((closure) => (
                  <tr key={`${closure.from}-${closure.detail}`}>
                    <td className="num">{closure.from}</td>
                    <td>{closure.detail}</td>
                    <td>{closure.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="consejos">
        <SectionBand index={index()} title="Consejos" titleId="consejos" />
        <div className="w">
          <table>
            <tbody>
              {tips.map((tip, tipIndex) => (
                <tr key={tip}>
                  <td className="n g">{tipIndex + 1}</td>
                  <td>{tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <div className="w">
          <table>
            <tbody>
              {venue ? (
                <tr>
                  <td>
                    <b>Guía del {venue.name}</b>
                  </td>
                  <td className="mut">Barrios, transporte y FAQ</td>
                  <td>
                    <Link href={`/estadio/${venue.slug}`} prefetch={true}>
                      Ver estadio →
                    </Link>
                  </td>
                </tr>
              ) : city ? (
                <tr>
                  <td>
                    <b>{city.name}</b>
                  </td>
                  <td className="mut">Recinto a confirmar</td>
                  <td>
                    <Link href={`/ciudad/${city.slug}`} prefetch={true}>
                      Ver ciudad →
                    </Link>
                  </td>
                </tr>
              ) : null}
              {siblings.map((item) => (
                <tr key={item.slug}>
                  <td>
                    <b>{item.artist}</b> ·{" "}
                    <span className="g">
                      {eventDateLabel(item.date, item.dateExact)}
                    </span>
                  </td>
                  <td className="mut">{item.type}</td>
                  <td>
                    <Link href={`/evento/${item.slug}`} prefetch={true}>
                      Ver hoteles →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
