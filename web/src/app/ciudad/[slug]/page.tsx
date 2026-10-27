import { Breadcrumbs } from "@/components/breadcrumbs";
import { EventRow } from "@/components/event-row";
import frame from "@/components/hero-frame.module.css";
import { JsonLd } from "@/components/json-ld";
import { PageFallback } from "@/components/page-fallback";
import { RowList } from "@/components/row-list";
import { SectionBand } from "@/components/section-band";
import { Note } from "@/components/section-intro";
import { StatRow } from "@/components/stat-row";
import { VenueCells } from "@/components/venue-cells";
import {
  getCities,
  getCity,
  upcomingForCity,
  venuesForCity,
} from "@/lib/content";
import { countdownTarget } from "@/lib/format";
import {
  breadcrumbList,
  eventItemList,
  placeItemList,
} from "@/lib/structured-data";
import { getCachedNow } from "@/lib/time";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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
  const hotels = venues.reduce((sum, venue) => sum + venue.hotelsWithin3km, 0);

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
          <p className={frame.lede}>
            {venues.length > 0
              ? `${venues.length === 1 ? "1 estadio" : `${venues.length} estadios`} con hoteles ordenados por distancia.`
              : "Todavía no hay un estadio cargado en esta ciudad."}
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
          title="Estadios"
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
          title="Próximos eventos"
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
    </main>
  );
}
