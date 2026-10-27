import { formatArs, formatKm } from "@/lib/format";
import { affiliateHref } from "@/lib/affiliate";
import type { Hotel } from "@/lib/types";

export function HotelTable({
  hotels,
  subId,
  place,
}: {
  hotels: Hotel[];
  subId: string;
  place: string;
}) {
  return (
    <table className="hot">
      <thead>
        <tr>
          <th scope="col">N°</th>
          <th scope="col">Hotel</th>
          <th scope="col">Barrio</th>
          <th scope="col" className="hide">
            A pie / auto
          </th>
          <th scope="col">Distancia</th>
          <th scope="col">Desde / noche</th>
          <th scope="col">
            <span className="sr-only">Disponibilidad</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {hotels.map((hotel, index) => (
          <tr key={hotel.slug}>
            <td className="n">{index + 1}</td>
            <td>
              <b>{hotel.name}</b>
              <div className="mut">{hotel.detail} · ejemplo</div>
            </td>
            <td>{hotel.neighborhood}</td>
            <td className="hide">
              {hotel.walkMinutes} min / {hotel.driveMinutes} min
            </td>
            <td className="num">{formatKm(hotel.distanceKm)}</td>
            <td className="num">{formatArs(hotel.pricePerNight)}</td>
            <td>
              <a
                href={affiliateHref(subId, `${hotel.neighborhood}, ${place}`)}
                rel="sponsored nofollow"
                target="_blank"
              >
                Ver disponibilidad →
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
