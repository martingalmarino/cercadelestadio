import { Breadcrumbs } from "@/components/breadcrumbs";
import { EventRow } from "@/components/event-row";
import frame from "@/components/hero-frame.module.css";
import { JsonLd } from "@/components/json-ld";
import { RowList } from "@/components/row-list";
import { SectionBand } from "@/components/section-band";
import { Note } from "@/components/section-intro";
import { StatRow } from "@/components/stat-row";
import { VenueCells } from "@/components/venue-cells";
import {
  getCities,
  getCity,
  announcedForCity,
  getVenue,
  upcomingForCity,
  venuesForCity,
} from "@/lib/content";
import { cityAnswer } from "@/lib/answers";
import { cityDescription, cityTitle, openGraphPage, withBrand } from "@/lib/seo";
import {
  breadcrumbList,
  eventItemList,
  placeItemList,
  webPage,
} from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

export function generateStaticParams() {
  return getCities().map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/ciudad/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) return { title: "Ciudad" };
  const title = withBrand(cityTitle(city));
  const description = cityDescription(city);
  const path = `/ciudad/${city.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraphPage(title, description, path),
  };
}

export default async function CityPage(props: PageProps<"/ciudad/[slug]">) {
  const { slug } = await props.params;
  const city = getCity(slug);
  if (!city) notFound();

  const venues = venuesForCity(city.slug);
  const now = await getCachedNow();
  const upcoming = upcomingForCity(city.slug, now);
  const announced = announcedForCity(city.slug);
  const venueBySlug = new Map(venues.map((venue) => [venue.slug, venue]));
  const hotels = venues.reduce((sum, venue) => sum + venue.hotelsWithin3km, 0);

  return (
    <main>
      <JsonLd
        data={[
          webPage({
            path: `/ciudad/${city.slug}`,
            name: cityTitle(city),
          }),
          breadcrumbList([
            { name: "Inicio", path: "/" },
            { name: city.name, path: `/ciudad/${city.slug}` },
          ]),
          placeItemList(
            `Estadios en ${city.name}`,
            venues.map((venue) => ({
              name: venue.seoName,
              path: `/estadio/${venue.slug}`,
            })),
          ),
          eventItemList(
            `Próximos eventos en ${city.name}`,
            upcoming.map((event) => ({
              name: event.artist,
              path: `/evento/${event.slug}`,
            })),
          ),
        ]}
      />
      <section className={`${frame.hero} inverse`}>
        <div className="container">
          <Breadcrumbs
            items={[
              { href: "/", label: "Inicio" },
              { href: "/#ciudades", label: "Ciudades" },
              { label: city.name },
            ]}
          />
          <h1 className={frame.venueTitle}>{city.name}</h1>
          <p className={frame.answer}>
            {venues.length > 0
              ? cityAnswer(city.name, venues)
              : `A 3 km de un estadio en ${city.name} la oferta está a confirmar. El transporte también está a confirmar.`}
          </p>
          <StatRow
            items={[
              { label: "Estadios", value: venues.length },
              {
                label: "Próximos eventos",
                value: <span className={frame.accent}>{upcoming.length}</span>,
              },
              { label: "Hoteles a 3 km", value: hotels || "—" },
            ]}
          />
        </div>
      </section>

      <section aria-labelledby="estadios-ciudad">
        <SectionBand
          index="01"
          title={`Estadios en ${city.name}`}
          titleId="estadios-ciudad"
          meta={venues.length === 0 ? "Próximamente" : `${venues.length} recintos`}
        />
        <div className={`container ${styles.block}`}>
          {venues.length === 0 ? (
            <Note>
              Cuando confirmemos un recinto en {city.name}, va a aparecer en
              esta lista.
            </Note>
          ) : (
            <VenueCells venues={venues} />
          )}
        </div>
      </section>

      <section aria-labelledby="eventos-ciudad">
        <SectionBand
          index="02"
          title={`Próximos recitales en ${city.name}`}
          titleId="eventos-ciudad"
        />
        <div className={`container ${styles.block}`}>
          {upcoming.length === 0 ? (
            <Note>No hay shows anunciados en {city.name}.</Note>
          ) : (
            <RowList label={`Próximos eventos en ${city.name}`}>
              {upcoming.map((event) => {
                const venue = event.venueSlug
                  ? venueBySlug.get(event.venueSlug)
                  : undefined;
                return (
                  <EventRow
                    key={event.slug}
                    href={`/evento/${event.slug}`}
                    date={event.date}
                    approximate={!event.dateExact}
                    title={event.artist}
                    subtitle={venue?.name ?? "Recinto a confirmar"}
                    actionLabel="Hoteles cerca"
                  />
                );
              })}
            </RowList>
          )}
        </div>
      </section>

      <section aria-labelledby="anunciados-ciudad">
        <SectionBand
          index="03"
          title="Anunciados sin fecha confirmada"
          titleId="anunciados-ciudad"
        />
        <div className={`container ${styles.block}`}>
          {announced.length === 0 ? (
            <Note>No hay anuncios sin fecha confirmada.</Note>
          ) : (
            <RowList label="Anunciados sin fecha confirmada">
              {announced.map((event) => (
                <EventRow
                  key={event.slug}
                  href={`/evento/${event.slug}`}
                  date={event.date}
                  approximate={!event.dateExact}
                  title={event.artist}
                  subtitle={
                    event.venueSlug
                      ? (getVenue(event.venueSlug)?.name ?? "Recinto a confirmar")
                      : "Recinto a confirmar"
                  }
                  actionLabel="Hoteles cerca"
                />
              ))}
            </RowList>
          )}
        </div>
      </section>
    </main>
  );
}
