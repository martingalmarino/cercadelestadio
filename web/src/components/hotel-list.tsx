"use client";

import { ButtonLink } from "@/components/ui/button";
import { formatArs, formatKm } from "@/lib/format";
import type { Hotel } from "@/lib/types";
import styles from "./hotel-list.module.css";

export function HotelList({
  hotels,
  subId,
  place,
  caption,
  activeSlug = null,
  onActiveChange,
}: {
  hotels: Hotel[];
  subId: string;
  place: string;
  caption: string;
  activeSlug?: string | null;
  onActiveChange?: (slug: string) => void;
}) {
  return (
    <table className={styles.table}>
      <caption className={styles.caption}>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">N°</th>
          <th scope="col">Hotel</th>
          <th scope="col">Barrio</th>
          <th scope="col">Distancia</th>
          <th scope="col">A pie</th>
          <th scope="col">En auto</th>
          <th scope="col">Desde / noche</th>
          <th scope="col">Disponibilidad</th>
        </tr>
      </thead>
      <tbody>
        {hotels.map((hotel, index) => (
          <tr
            className={hotel.slug === activeSlug ? styles.active : undefined}
            id={`hotel-${hotel.slug}`}
            key={hotel.slug}
            aria-current={hotel.slug === activeSlug ? "true" : undefined}
            onMouseEnter={onActiveChange ? () => onActiveChange(hotel.slug) : undefined}
            onFocus={onActiveChange ? () => onActiveChange(hotel.slug) : undefined}
          >
            <td className={styles.index}>{index + 1}</td>
            <th scope="row" className={styles.hotel}>
              <span className={styles.name}>{hotel.name}</span>
              <span className={styles.detail}>{hotel.detail}</span>
            </th>
            <td className={styles.area}>{hotel.neighborhood}</td>
            <td className={styles.figure}>{formatKm(hotel.distanceKm)}</td>
            <td>{hotel.walkMinutes} min a pie</td>
            <td>{hotel.driveMinutes} min en auto</td>
            <td className={styles.figure}>{formatArs(hotel.pricePerNight)}</td>
            <td className={styles.action}>
              <ButtonLink
                affiliate
                subId={subId}
                query={`${hotel.neighborhood}, ${place}`}
              >
                Ver disponibilidad
              </ButtonLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
