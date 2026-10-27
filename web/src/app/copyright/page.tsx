import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Copyright",
  description: "Créditos de los mapas y datos geográficos de cercadelestadio.",
  alternates: { canonical: "/copyright" },
};

export default function CopyrightPage() {
  return (
    <main className={`container ${styles.page}`}>
      <h1>Copyright</h1>
      <p>© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors</p>
      <ul>
        <li>
          Mapa:{" "}
          <a href="https://openfreemap.org/">OpenFreeMap</a>
        </li>
        <li>
          Estilo de teselas:{" "}
          <a href="https://openmaptiles.org/">OpenMapTiles</a>
        </li>
        <li>
          Datos:{" "}
          <a href="https://www.openstreetmap.org/copyright">
            OpenStreetMap contributors
          </a>
          , bajo la licencia ODbL.
        </li>
      </ul>
    </main>
  );
}
