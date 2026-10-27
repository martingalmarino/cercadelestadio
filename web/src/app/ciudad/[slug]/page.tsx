import { JsonLd } from "@/components/json-ld";
import { SectionBand } from "@/components/section-band";
import {
  getCities,
  getCity,
  upcomingForCity,
  venuesForCity,
} from "@/lib/content";
import { countdownTarget, eventDateLabel, formatCount } from "@/lib/format";
import {
  breadcrumbList,
  eventItemList,
  placeItemList,
} from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import { PageFallback } from "@/components/page-fallback";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export function generateStaticParams() {
  return getCities().map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/ciudad/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) return { title: "Ciudad" };
  return {
    title: `Hoteles en ${city.name}`,
    description: `Estadios, recitales y hoteles por distancia en ${city.name}.`,
    alternates: { canonical: `/ciudad/${city.slug}` },
  };
}

export default function CityPage(props: PageProps<"/ciudad/[slug]">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <CityContent params={props.params} />
    </Suspense>
  );
}

async function CityContent({
  params,
}: {
  params: PageProps<"/ciudad/[slug]">["params"];
}) {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  const venues = venuesForCity(city.slug);
  const now = await getCachedNow();
  const upcoming = upcomingForCity(city.slug, now);
  const venueBySlug = new Map(venues.map((venue) => [venue.slug, venue]));

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbList([
            { name: "Inicio", path: "/" },
            { name: city.name, path: `/ciudad/${city.slug}` },
          ]),
          ...(venues.length > 0
            ? [
                placeItemList(
                  `Estadios en ${city.name}`,
                  venues.map((venue) => ({
                    name: venue.name,
                    path: `/estadio/${venue.slug}`,
                  })),
                ),
              ]
            : []),
          ...(upcoming.length > 0
            ? [
                eventItemList(
                  `Próximos eventos en ${city.name}`,
                  upcoming.map((event) => ({
                    name: event.artist,
                    path: `/evento/${event.slug}`,
                    startDate: countdownTarget(event),
                  })),
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
            <Link href="/#ciudades">Ciudades</Link>
          </p>
          <h1>{city.name}</h1>
          <p className="sub">
            {venues.length > 0
              ? `${venues.length === 1 ? "1 estadio" : `${venues.length} estadios`} con hoteles ordenados por distancia.`
              : "Todavía no hay un estadio cargado en esta ciudad."}
          </p>
          <div className="facts facts-3">
            <div>
              <small>Estadios</small>
              <b>{venues.length}</b>
            </div>
            <div>
              <small>Próximos eventos</small>
              <b className="ok">{upcoming.length}</b>
            </div>
            <div>
              <small>Hoteles a 3 km</small>
              <b>
                {venues.reduce((sum, venue) => sum + venue.hotelsWithin3km, 0) ||
                  "—"}
              </b>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="estadios-ciudad">
        <SectionBand
          index="01"
          title="Estadios"
          titleId="estadios-ciudad"
          meta={venues.length === 0 ? "Próximamente" : `${venues.length} recintos`}
        />
        <div className="w">
          {venues.length === 0 ? (
            <p className="line">
              Cuando confirmemos un recinto en {city.name}, va a aparecer en
              esta lista.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Estadio</th>
                  <th scope="col">Barrio</th>
                  <th scope="col" className="hide">
                    Capacidad
                  </th>
                  <th scope="col">Hoteles a 3 km</th>
                  <th scope="col">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {venues.map((venue) => (
                  <tr key={venue.slug}>
                    <td>
                      <b>{venue.name}</b>
                    </td>
                    <td>{venue.neighborhood}</td>
                    <td className="hide num">{formatCount(venue.capacity)}</td>
                    <td className="num">{venue.hotelsWithin3km}</td>
                    <td>
                      <Link href={`/estadio/${venue.slug}`} prefetch={true}>
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section aria-labelledby="eventos-ciudad">
        <SectionBand
          index="02"
          title="Próximos eventos"
          titleId="eventos-ciudad"
        />
        <div className="w">
          {upcoming.length === 0 ? (
            <p className="line">No hay shows anunciados en {city.name}.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Evento</th>
                  <th scope="col">Estadio</th>
                  <th scope="col">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((event) => {
                  const venue = event.venueSlug
                    ? venueBySlug.get(event.venueSlug)
                    : undefined;
                  return (
                    <tr key={event.slug}>
                      <td className="g">
                        {eventDateLabel(event.date, event.dateExact)}
                      </td>
                      <td>
                        <b>{event.artist}</b>
                      </td>
                      <td>{venue?.name ?? "Recinto a confirmar"}</td>
                      <td>
                        <Link href={`/evento/${event.slug}`} prefetch={true}>
                          Hoteles cerca →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
