"use client";

import { ButtonLink } from "@/components/ui/button";
import { formatArs, formatKm } from "@/lib/format";
import type { Hotel } from "@/lib/types";
import styles from "./hotel-list.module.css";

export function HotelList({
  hotels,
  subId,
  place,
  activeSlug = null,
  onActiveChange,
}: {
  hotels: Hotel[];
  subId: string;
  place: string;
  activeSlug?: string | null;
  onActiveChange?: (slug: string) => void;
}) {
  return (
    <div className={styles.list}>
      <div className={styles.head} aria-hidden="true">
        <span>N°</span>
        <span>Hotel</span>
        <span>Barrio</span>
        <span className={styles.walk}>A pie / auto</span>
        <span>Distancia</span>
        <span>Desde / noche</span>
        <span>Disponibilidad</span>
      </div>
      <div role="list">
        {hotels.map((hotel, index) => (
          <div
            className={hotel.slug === activeSlug ? `${styles.row} is-active` : styles.row}
            role="listitem"
            id={`hotel-${hotel.slug}`}
            key={hotel.slug}
            aria-current={hotel.slug === activeSlug ? "true" : undefined}
            onMouseEnter={onActiveChange ? () => onActiveChange(hotel.slug) : undefined}
            onFocus={onActiveChange ? () => onActiveChange(hotel.slug) : undefined}
          >
            <span className={styles.index}>{index + 1}</span>
            <span className={styles.hotel}>
              <span className={styles.name}>{hotel.name}</span>
              <span className={styles.detail}>
                {hotel.detail} · ejemplo
              </span>
            </span>
            <span className={styles.area}>{hotel.neighborhood}</span>
            <span className={styles.walk}>
              {hotel.walkMinutes} min / {hotel.driveMinutes} min
            </span>
            <span className={`${styles.distance} ${styles.figure}`}>
              {formatKm(hotel.distanceKm)}
            </span>
            <span className={`${styles.price} ${styles.figure}`}>
              {formatArs(hotel.pricePerNight)}
            </span>
            <span className={styles.action}>
              <ButtonLink
                affiliate
                subId={subId}
                query={`${hotel.neighborhood}, ${place}`}
              >
                Ver disponibilidad
              </ButtonLink>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
