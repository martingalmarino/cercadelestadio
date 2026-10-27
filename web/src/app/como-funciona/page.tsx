import { JsonLd } from "@/components/json-ld";
import { breadcrumbList, webPage } from "@/lib/structured-data";
import { openGraphPage, withBrand } from "@/lib/seo";
import type { Metadata } from "next";
import styles from "./page.module.css";

const howTitle = withBrand("Cómo funciona cercadelestadio");
const howDescription =
  "Cómo medimos la distancia de cada hotel al estadio, de dónde salen los datos de transporte y cortes, y cómo ganamos comisión con Booking sin costo extra.";

export const metadata: Metadata = {
  title: howTitle,
  description: howDescription,
  alternates: { canonical: "/como-funciona" },
  openGraph: openGraphPage(howTitle, howDescription, "/como-funciona"),
};

export default function HowItWorksPage() {
  return (
    <main className={`container ${styles.page}`}>
      <JsonLd
        data={[
          webPage({
            path: "/como-funciona",
            name: "Cómo funciona cercadelestadio",
          }),
          breadcrumbList([
            { name: "Inicio", path: "/" },
            { name: "Cómo funciona", path: "/como-funciona" },
          ]),
        ]}
      />
      <h1>Cómo funciona cercadelestadio</h1>
      <p>
        La distancia se mide en línea recta y se publica en km: anillos de 1, 3
        y 5 km desde el centro del estadio. El acceso nombra la línea de subte,
        tren o colectivo de cada ficha. Si falta un dato, decimos que está a
        confirmar.
      </p>

      <h2>Distancias</h2>
      <p>
        Medimos en línea recta desde el centro del estadio, no por el recorrido
        de la calle. El contorno del recinto sale de OpenStreetMap. En el mapa
        se ven anillos de 1, 3 y 5 km. Los minutos a pie y en auto son una
        estimación en línea recta: a pie, a 4,5 km/h.
      </p>

      <h2>Transporte y cortes</h2>
      <p>
        Cada estadio publica las líneas que tiene cargadas: subte, tren o
        colectivo, con la estación o la parada de la ficha. Los cortes de calle
        son orientativos hasta que haya un aviso del día del evento. No
        completamos un horario que no esté en los datos.
      </p>

      <h2>Actualización</h2>
      <p>
        Debajo del título de cada estadio y de cada evento figura Actualizado
        el, con la fecha de esa ficha. La misma fecha entra en el sitemap y en
        los datos estructurados. La cambiamos cuando editamos el show, el
        acceso o los hoteles.
      </p>

      <h2>Reserva y afiliados</h2>
      <p>
        El botón de disponibilidad abre Booking. Si reservás, cobramos comisión
        sin costo extra. Los nombres de hotel salen de OpenStreetMap. El precio
        y la disponibilidad se ven en Booking.
      </p>

      <h2>Contacto</h2>
      <p>El correo de contacto está a confirmar.</p>

      <h2 id="creditos">Créditos</h2>
      <p>© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors</p>
      <ul>
        <li>
          Mapa: <a href="https://openfreemap.org/">OpenFreeMap</a>
        </li>
        <li>
          Estilo de teselas: <a href="https://openmaptiles.org/">OpenMapTiles</a>
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
