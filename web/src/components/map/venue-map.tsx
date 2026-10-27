"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Hotel, VenueOutline } from "@/lib/types";
import { VenueMapStatic } from "./venue-map-static";
import styles from "./venue-map.module.css";

const VenueMapInteractive = dynamic(() => import("./venue-map-interactive"), {
  ssr: false,
  loading: () => null,
});

function wantsSaveData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

export function VenueMap({
  venue,
  outline,
  hotels,
  activeSlug,
  onActiveChange,
}: {
  venue: { name: string; lat: number; lng: number };
  outline: VenueOutline | null;
  hotels: Hotel[];
  activeSlug: string | null;
  onActiveChange: (slug: string) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || wantsSaveData()) return;

    let scrolled = false;
    let visible = false;
    const arm = () => {
      if (scrolled && visible) setRequested(true);
    };
    const onScroll = () => {
      scrolled = true;
      arm();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        arm();
      },
      { rootMargin: "200px" },
    );
    observer.observe(stage);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <figure
      className={styles.figure}
      role="region"
      aria-label={`Mapa de ${venue.name} con hoteles cercanos`}
    >
      <p className="sr-only">La lista de hoteles de abajo tiene la misma información.</p>
      <div className={styles.stage} ref={stageRef}>
        {ready ? null : (
          <VenueMapStatic
            origin={{ lat: venue.lat, lng: venue.lng }}
            outline={outline}
            hotels={hotels}
            activeSlug={activeSlug}
          />
        )}
        {requested ? (
          <VenueMapInteractive
            venue={venue}
            outline={outline}
            hotels={hotels.flatMap((hotel) =>
              hotel.lat === undefined || hotel.lng === undefined
                ? []
                : [
                    {
                      slug: hotel.slug,
                      name: hotel.name,
                      lat: hotel.lat,
                      lng: hotel.lng,
                      distanceKm: hotel.distanceKm,
                    },
                  ],
            )}
            activeSlug={activeSlug}
            onActiveChange={onActiveChange}
            onReady={() => setReady(true)}
          />
        ) : (
          <Button className={styles.toggle} variant="secondary" onClick={() => setRequested(true)}>
            Ver mapa interactivo
          </Button>
        )}
      </div>
      <figcaption>
        <p className={styles.caption}>{venue.name} · anillos 1 / 3 / 5 km</p>
        <ol className={styles.legend}>
          {hotels.map((hotel) => (
            <li key={hotel.slug}>
              <a
                href={`#hotel-${hotel.slug}`}
                onMouseEnter={() => onActiveChange(hotel.slug)}
                onFocus={() => onActiveChange(hotel.slug)}
              >
                {hotel.name}
              </a>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
