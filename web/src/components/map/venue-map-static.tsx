import type { Hotel, VenueOutline } from "@/lib/types";
import styles from "./venue-map.module.css";

const METERS = 111_320;
const RINGS = [1, 3, 5] as const;
const VIEW_W = 1600;
const VIEW_H = 1000;

type Origin = { lat: number; lng: number };

function metersFrom(origin: Origin, lng: number, lat: number) {
  const cos = Math.cos((origin.lat * Math.PI) / 180);
  return {
    x: (lng - origin.lng) * METERS * cos,
    y: (origin.lat - lat) * METERS,
  };
}

function polygons(outline: VenueOutline) {
  return outline.geometry.type === "Polygon"
    ? [outline.geometry.coordinates]
    : outline.geometry.coordinates;
}

export function VenueMapStatic({
  origin,
  outline,
  hotels,
  activeSlug,
}: {
  origin: Origin;
  outline: VenueOutline | null;
  hotels: Hotel[];
  activeSlug: string | null;
}) {
  let extent = 5000;
  const remember = (lng: number, lat: number) => {
    const point = metersFrom(origin, lng, lat);
    extent = Math.max(extent, Math.hypot(point.x, point.y));
  };

  for (const hotel of hotels) {
    if (hotel.lat !== undefined && hotel.lng !== undefined) remember(hotel.lng, hotel.lat);
  }
  if (outline) {
    for (const polygon of polygons(outline)) {
      for (const ring of polygon) {
        for (const position of ring) remember(position[0], position[1]);
      }
    }
  }
  extent *= 1.28;

  const scale = VIEW_H / 2 / extent;
  const place = (lng: number, lat: number) => {
    const point = metersFrom(origin, lng, lat);
    return {
      x: VIEW_W / 2 + point.x * scale,
      y: VIEW_H / 2 + point.y * scale,
    };
  };
  const ringRadius = (kilometers: number) => kilometers * 1000 * scale;
  const center = place(origin.lng, origin.lat);

  const outlinePath = outline
    ? polygons(outline)
        .flatMap((polygon) =>
          polygon.map((ring) => {
            const commands = ring.map((position, index) => {
              const point = place(position[0], position[1]);
              return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
            });
            return `${commands.join(" ")} Z`;
          }),
        )
        .join(" ")
    : "";

  return (
    <div className={styles.plot} aria-hidden="true">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid slice">
        {RINGS.map((kilometers) => (
          <circle
            key={kilometers}
            className={styles.ring}
            cx={center.x}
            cy={center.y}
            r={ringRadius(kilometers)}
          />
        ))}
        {RINGS.map((kilometers) => (
          <text
            key={kilometers}
            className={styles.ringLabel}
            x={center.x}
            y={center.y - ringRadius(kilometers)}
            textAnchor="middle"
          >
            {kilometers} KM
          </text>
        ))}
        {outline ? (
          <path className={styles.stadium} d={outlinePath} fillRule="evenodd" />
        ) : (
          <rect
            className={styles.stadium}
            x={center.x - 14}
            y={center.y - 11}
            width={28}
            height={22}
          />
        )}
      </svg>
      {hotels.map((hotel, index) => {
        if (hotel.lat === undefined || hotel.lng === undefined) return null;
        const point = place(hotel.lng, hotel.lat);
        const active = hotel.slug === activeSlug;
        return (
          <span
            key={hotel.slug}
            className={
              active
                ? `${styles.pin} ${styles.staticPin} ${styles.pinActive}`
                : `${styles.pin} ${styles.staticPin}`
            }
            style={{ ["--fx" as string]: point.x / VIEW_W, ["--fy" as string]: point.y / VIEW_H }}
          >
            {index + 1}
          </span>
        );
      })}
    </div>
  );
}
