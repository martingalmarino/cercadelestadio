"use client";

import { ButtonLink } from "@/components/ui/button";
import { formatArs, formatKm } from "@/lib/format";
import type { Hotel } from "@/lib/types";
import styles from "./hotel-list.module.css";

const WALK_ESTIMATE = "Estimado en línea recta a 4,5 km/h";

function hotelDetail(hotel: Hotel) {
  const cleaned = hotel.detail.replace(/\s*·\s*\d+[,.]\d+\b/g, "").trim();
  if (hotel.stars == null) return cleaned;
  const stars = hotel.stars === 1 ? "1 estrella" : `${hotel.stars} estrellas`;
  if (/estrella/i.test(cleaned)) return cleaned;
  return cleaned ? `${cleaned} · ${stars}` : stars;
}

function bookingLabel(hotel: Hotel) {
  return hotel.bookingStatus === "busqueda-geo"
    ? "Ver hoteles en la zona"
    : "Ver precio en Booking";
}

export function HotelList({
  hotels,
  bookingHrefs,
  caption,
  activeSlug = null,
  onActiveChange,
}: {
  hotels: Hotel[];
  bookingHrefs: Record<string, string>;
  caption: string;
  activeSlug?: string | null;
  onActiveChange?: (slug: string) => void;
}) {
  const rows = hotels.filter((hotel) => bookingHrefs[hotel.slug]);
  const hasPrices = rows.some((hotel) => hotel.pricePerNight != null);

  return (
    <table className={hasPrices ? `${styles.table} ${styles.withPrices}` : styles.table}>
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
            Auto (est.)
          </th>
          {hasPrices ? <th scope="col">Desde / noche</th> : null}
          <th scope="col">Disponibilidad</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((hotel, index) => {
          const href = bookingHrefs[hotel.slug];
          const label = bookingLabel(hotel);
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
              {hasPrices ? (
                <td className={styles.price}>
                  {hotel.pricePerNight == null ? "—" : formatArs(hotel.pricePerNight)}
                </td>
              ) : null}
              <td className={styles.action}>
                <ButtonLink href={href} sponsored>
                  {label}
                </ButtonLink>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
