"use client";

import { ButtonLink } from "@/components/ui/button";
import { formatArs, formatKm } from "@/lib/format";
import type { Hotel } from "@/lib/types";
import styles from "./hotel-list.module.css";

const WALK_ESTIMATE = "Estimado en línea recta a 4,5 km/h";

function bookingQuery(hotel: Hotel, place: string) {
  return `${hotel.name} ${hotel.city ?? place}`.trim();
}

function hotelDetail(hotel: Hotel) {
  const cleaned = hotel.detail.replace(/\s*·\s*\d+[,.]\d+\b/g, "").trim();
  if (hotel.stars == null) return cleaned;
  const stars = hotel.stars === 1 ? "1 estrella" : `${hotel.stars} estrellas`;
  if (/estrella/i.test(cleaned)) return cleaned;
  return cleaned ? `${cleaned} · ${stars}` : stars;
}

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
          <th scope="col" title={WALK_ESTIMATE}>
            A pie (est.)
          </th>
          <th scope="col" title={WALK_ESTIMATE}>
            En auto (est.)
          </th>
          <th scope="col">Desde / noche</th>
          <th scope="col">Disponibilidad</th>
        </tr>
      </thead>
      <tbody>
        {hotels.map((hotel, index) => {
          const query = bookingQuery(hotel, place);
          return (
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
                <span className={styles.detail}>{hotelDetail(hotel)}</span>
              </th>
              <td className={styles.area}>{hotel.neighborhood}</td>
              <td className={styles.figure}>{formatKm(hotel.distanceKm)}</td>
              <td title={WALK_ESTIMATE}>{hotel.walkMinutes} min a pie</td>
              <td title={WALK_ESTIMATE}>{hotel.driveMinutes} min en auto</td>
              <td className={styles.price}>
                {hotel.pricePerNight == null ? (
                  <ButtonLink affiliate subId={subId} query={query}>
                    Ver precio en Booking
                  </ButtonLink>
                ) : (
                  formatArs(hotel.pricePerNight)
                )}
              </td>
              <td className={styles.action}>
                <ButtonLink affiliate subId={subId} query={query}>
                  Ver disponibilidad
                </ButtonLink>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
