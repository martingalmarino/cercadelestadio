import { formatCount } from "@/lib/format";
import { venueTitle } from "@/lib/seo";
import type { Venue } from "@/lib/types";
import Link from "next/link";
import styles from "./venue-cells.module.css";

export function VenueCells({ venues }: { venues: Venue[] }) {
  return (
    <div className={styles.cells}>
      {venues.map((venue) => (
        <Link key={venue.slug} className={styles.cell} href={`/estadio/${venue.slug}`}>
          <span className={styles.kicker}>{venue.neighborhood}</span>
          <h3>{venueTitle(venue)}</h3>
          <dl>
            <div>
              <dt>Capacidad</dt>
              <dd>{formatCount(venue.capacity)}</dd>
            </div>
            <div>
              <dt>Hoteles a 3 km</dt>
              <dd>{venue.hotelsWithin3km}</dd>
            </div>
          </dl>
        </Link>
      ))}
    </div>
  );
}
