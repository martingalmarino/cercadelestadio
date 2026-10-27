import type { Hotel } from "@/lib/types";
import styles from "./venue-map.module.css";

type VenueMapProps = {
  venueName: string;
  hotels: Hotel[];
};

const PIN = 28;

function markerOrigin(hotel: Hotel, index: number) {
  if (hotel.mapX !== undefined && hotel.mapY !== undefined) {
    return { x: hotel.mapX - 3, y: hotel.mapY - 3 };
  }
  const angles = [-50, 40, -130, 150, 100, -20];
  const angle = (angles[index % angles.length] * Math.PI) / 180;
  const radius = hotel.distanceKm * 55;
  return {
    x: Math.round(300 + Math.cos(angle) * radius - PIN / 2),
    y: Math.round(260 + Math.sin(angle) * radius - PIN / 2),
  };
}

export function VenueMap({ venueName, hotels }: VenueMapProps) {
  return (
    <figure className={styles.figure}>
      <div className={styles.canvas}>
        <svg
          width="100%"
          height="100%"
          viewBox="-200 0 1000 520"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Plano esquemático de ${venueName} con anillos de 1, 3 y 5 km`}
        >
          <title>{`${venueName}. Anillos de 1, 3 y 5 kilómetros.`}</title>
          <g className={styles.road} strokeWidth="10">
            <path d="M0 120L600 380" />
            <path d="M80 0L420 520" />
            <path d="M0 330L600 300" />
          </g>
          <g className={styles.street} strokeWidth="4">
            <path d="M0 60L600 80M0 200L600 220M0 450L600 430M200 0L180 520M480 0L500 520" />
          </g>
          <path className={styles.river} d="M600 40L360 520" strokeWidth="22" />
          <g className={styles.ring}>
            <circle cx="300" cy="260" r="60" />
            <circle cx="300" cy="260" r="150" />
            <circle cx="300" cy="260" r="240" />
          </g>
          <g className={styles.ringLabel}>
            <text x="306" y="196">
              1 KM
            </text>
            <text x="306" y="106">
              3 KM
            </text>
            <text x="306" y="16">
              5 KM
            </text>
          </g>
          <rect className={styles.stadium} x="282" y="246" width="36" height="28" />
          {hotels.map((hotel, index) => {
            const { x, y } = markerOrigin(hotel, index);
            return (
              <g key={hotel.slug} className={styles.marker}>
                <rect className={styles.pin} x={x} y={y} width={PIN} height={PIN} />
                <text x={x + PIN / 2} y={y + 19} textAnchor="middle" fill="currentColor">
                  {index + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>
        <p className={styles.caption}>
          {venueName} · anillos 1 / 3 / 5 km · plano esquemático
        </p>
        <ol className={styles.legend}>
          {hotels.map((hotel) => (
            <li key={hotel.slug}>
              <a href={`#hotel-${hotel.slug}`}>{hotel.name}</a>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
