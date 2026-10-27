import { getCities, publishedVenues } from "@/lib/content";
import { venueTitle } from "@/lib/seo";
import Link from "next/link";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  const venues = publishedVenues();
  const cities = getCities();

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.about}>
          <h2>cercadelestadio</h2>
          <p>
            Guía de alojamiento cerca de estadios y recintos de Argentina.
            Horarios y cortes de calle son orientativos.
          </p>
          <p>
            <Link href="/como-funciona">Cómo funciona</Link>
          </p>
        </div>
        <div className={styles.col}>
          <h2>Estadios</h2>
          <ul>
            {venues.map((venue) => (
              <li key={venue.slug}>
                <Link href={`/estadio/${venue.slug}`}>{venueTitle(venue)}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.col} id="ciudades">
          <h2>Ciudades</h2>
          <ul>
            {cities.map((city) => (
              <li key={city.slug}>
                <Link href={`/ciudad/${city.slug}`}>{city.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.legal}>
          © 2026 cercadelestadio.com · Buenos Aires, Argentina
        </p>
        <p className={styles.disclosure}>
          Algunos enlaces son de afiliado. Si reservás a través de ellos
          podemos recibir una comisión, sin costo extra para vos. Horarios y
          cortes de calle son orientativos.
        </p>
        <p className={styles.attribution}>
          Datos de hoteles y mapas ©{" "}
          <a href="https://www.openstreetmap.org/copyright">
            colaboradores de OpenStreetMap (ODbL)
          </a>
        </p>
      </div>
    </footer>
  );
}
