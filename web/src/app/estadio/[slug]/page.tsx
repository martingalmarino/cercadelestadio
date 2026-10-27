import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { HotelTable } from "@/components/hotel-table";
import { SectionBand } from "@/components/section-band";
import { Timeline } from "@/components/timeline";
import { VenueMap } from "@/components/venue-map";
import {
  getCity,
  getVenue,
  getVenues,
  hotelsFor,
  upcomingForVenue,
} from "@/lib/content";
import { PageFallback } from "@/components/page-fallback";
import { eventDateLabel, formatCount, withArticle } from "@/lib/format";
import {
  breadcrumbList,
  faqPage,
  hotelItemList,
  venueEventList,
} from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

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

export default function StadiumPage(props: PageProps<"/estadio/[slug]">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <StadiumContent params={props.params} />
    </Suspense>
  );
}

async function StadiumContent({
  params,
}: {
  params: PageProps<"/estadio/[slug]">["params"];
}) {
  const { slug } = await params;
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
      <section className="hero">
        <div className="w">
          <p className="crumb">
            <Link href="/">Inicio</Link>
            {" / "}
            <Link href="/#estadios">Estadios</Link>
            {city ? ` / ${city.name}` : null}
          </p>
          <h1>{venue.name}</h1>
          <p className="sub">{venue.address}</p>
          <div className="facts">
            <div>
              <small>Capacidad</small>
              <b>{formatCount(venue.capacity)}</b>
            </div>
            <div>
              <small>Barrio</small>
              <b>{venue.neighborhood}</b>
            </div>
            <div>
              <small>Hoteles a 3 km</small>
              <b>{venue.hotelsWithin3km}</b>
            </div>
            <div>
              <small>Próximos eventos</small>
              <b className="ok">{upcoming.length}</b>
            </div>
            <div>
              <small>{venue.accessLabel}</small>
              <b>{venue.accessValue}</b>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="hoteles">
        <SectionBand
          index="01"
          title="Hoteles por distancia"
          titleId="hoteles"
          meta="Precios de ejemplo · noche estándar"
        />
        <div className="w">
          <div className="stack">
            <VenueMap venueName={venue.name} hotels={hotels} />
            <HotelTable
              hotels={hotels}
              subId={upcoming[0]?.slug ?? venue.slug}
              place={place}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="barrios">
        <SectionBand index="02" title="Barrios recomendados" titleId="barrios" />
        <div className="w">
          <div className="cols cols-3">
            {venue.neighborhoods.map((area) => (
              <div key={area.name}>
                <span className="lab">{area.range}</span>
                <h3>{area.name}</h3>
                <p className="mut">{area.summary}</p>
                <p className="note">
                  <b>A favor:</b> {area.pros}. <b>En contra:</b> {area.cons}.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="llegar">
        <SectionBand index="03" title="Cómo llegar y volver" titleId="llegar" />
        <div className="w">
          <div className="grid2 tight">
            <Timeline steps={venue.transit} />
            <div className="line">
              <span className="lab">{venue.returnAdvice.label}</span>
              <h3>{venue.returnAdvice.title}</h3>
              <p className="mut">{venue.returnAdvice.text}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="cortes">
        <SectionBand
          index="04"
          title="Cortes y seguridad"
          titleId="cortes"
          meta="Días de evento"
        />
        <div className="w">
          <table>
            <thead>
              <tr>
                <th scope="col">Desde</th>
                <th scope="col">Corte</th>
                <th scope="col">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {venue.closures.map((closure) => (
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

      <section aria-labelledby="proximos">
        <SectionBand
          index="05"
          title={`Próximos eventos en ${withArticle(venue.name)}`}
          titleId="proximos"
        />
        <div className="w">
          {upcoming.length === 0 ? (
            <p className="line">No hay shows anunciados en este estadio.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Evento</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((event) => (
                  <tr key={event.slug}>
                    <td className="g">
                      {eventDateLabel(event.date, event.dateExact)}
                    </td>
                    <td>
                      <b>{event.artist}</b>
                    </td>
                    <td>{event.type}</td>
                    <td>
                      <Link href={`/evento/${event.slug}`} prefetch={true}>
                        Ver hoteles →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section aria-labelledby="faq">
        <SectionBand index="06" title="Preguntas frecuentes" titleId="faq" />
        <div className="w">
          <FaqList items={venue.faq} />
        </div>
      </section>
    </main>
  );
}
