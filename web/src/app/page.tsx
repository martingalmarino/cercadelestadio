import { JsonLd } from "@/components/json-ld";
import { SectionBand } from "@/components/section-band";
import {
  cityDetail,
  getCities,
  getCity,
  getEvents,
  getVenue,
  getVenues,
} from "@/lib/content";
import { upcomingEvents } from "@/lib/events";
import { countdownTarget, eventDateLabel, formatCount } from "@/lib/format";
import { breadcrumbList, eventItemList } from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import type { Metadata } from "next";
import Link from "next/link";

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

export default async function Home() {
  const now = await getCachedNow();
  const events = upcomingEvents(getEvents(), now);
  const venues = getVenues();
  const cities = getCities();

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbList([{ name: "Inicio", path: "/" }]),
          eventItemList(
            "Próximos eventos",
            events.map((event) => ({
              name: event.artist,
              path: `/evento/${event.slug}`,
              startDate: countdownTarget(event),
            })),
          ),
        ]}
      />
      <section className="hero">
        <div className="w">
          <p className="crumb">Hoteles cerca de estadios · Argentina</p>
          <h1>Dormí cerca del show.</h1>
          <p className="sub">
            Hoteles por distancia, cómo llegar y cómo volver, para cada
            estadio y recital del país.
          </p>
          <form className="search" role="search" action="/" method="get">
            <input
              name="q"
              type="text"
              placeholder="Buscá un evento o estadio"
              aria-label="Buscá un evento o estadio"
            />
            <input
              className="d"
              name="fecha"
              type="text"
              placeholder="Fecha"
              aria-label="Fecha"
            />
            <button type="submit">Buscar</button>
          </form>
        </div>
      </section>

      <section id="eventos" aria-labelledby="titulo-eventos">
        <SectionBand
          index="01"
          title="Próximos eventos"
          titleId="titulo-eventos"
          meta="Actualizado 27/10/2026"
        />
        <div className="w">
          <table>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Evento</th>
                <th scope="col">Estadio</th>
                <th scope="col" className="hide">
                  Ciudad
                </th>
                <th scope="col">
                  <span className="sr-only">Acción</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const venue = event.venueSlug ? getVenue(event.venueSlug) : null;
                const city = getCity(event.citySlug);
                return (
                  <tr key={event.slug}>
                    <td className="g">
                      {eventDateLabel(event.date, event.dateExact)}
                    </td>
                    <td>
                      <b>{event.artist}</b>
                    </td>
                    <td>{venue?.name ?? "Recinto a confirmar"}</td>
                    <td className="hide">{city?.name}</td>
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
        </div>
      </section>

      <section id="estadios" aria-labelledby="titulo-estadios">
        <SectionBand
          index="02"
          title="Estadios"
          titleId="titulo-estadios"
          meta={`${venues.length} recintos`}
        />
        <div className="w">
          <table>
            <thead>
              <tr>
                <th scope="col">Estadio</th>
                <th scope="col">Barrio / ciudad</th>
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
              {venues.map((venue) => {
                const city = getCity(venue.citySlug);
                const area =
                  city?.name === "Buenos Aires"
                    ? `${venue.neighborhood}, CABA`
                    : (city?.name ?? venue.neighborhood);
                return (
                  <tr key={venue.slug}>
                    <td>
                      <b>{venue.name}</b>
                    </td>
                    <td>{area}</td>
                    <td className="hide num">{formatCount(venue.capacity)}</td>
                    <td className="num">{venue.hotelsWithin3km}</td>
                    <td>
                      <Link href={`/estadio/${venue.slug}`} prefetch={true}>
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="ciudades" aria-labelledby="titulo-ciudades">
        <SectionBand index="03" title="Ciudades" titleId="titulo-ciudades" />
        <div className="w">
          <div className="cols cols-cities">
            {cities.map((city) => (
              <div key={city.slug}>
                <h3>
                  <Link href={`/ciudad/${city.slug}`} prefetch={true}>
                    {city.name}
                  </Link>
                </h3>
                <span className="mut">{cityDetail(city.slug)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" aria-labelledby="titulo-como">
        <SectionBand
          index="04"
          title="Cómo funciona"
          titleId="titulo-como"
        />
        <div className="w">
          <div className="cols cols-3">
            {steps.map((step) => (
              <div key={step.n}>
                <span className="g">{step.n}</span>
                <h3>{step.title}</h3>
                <p className="mut">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
