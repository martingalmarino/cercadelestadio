import type { Hotel } from "@/lib/types";

type VenueMapProps = {
  venueName: string;
  hotels: Hotel[];
};

function markerOrigin(hotel: Hotel, index: number) {
  if (hotel.mapX !== undefined && hotel.mapY !== undefined) {
    return { x: hotel.mapX, y: hotel.mapY };
  }
  const angles = [-50, 40, -130, 150, 100, -20];
  const angle = (angles[index % angles.length] * Math.PI) / 180;
  const radius = hotel.distanceKm * 55;
  return {
    x: Math.round(300 + Math.cos(angle) * radius - 11),
    y: Math.round(260 + Math.sin(angle) * radius - 11),
  };
}

export function VenueMap({ venueName, hotels }: VenueMapProps) {
  return (
    <div className="map">
      <svg
        width="100%"
        height="100%"
        viewBox="-200 0 1000 520"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Plano esquemático de ${venueName} con anillos de 1, 3 y 5 km`}
      >
        <title>{`${venueName}. Anillos de 1, 3 y 5 kilómetros.`}</title>
        <g stroke="#fff" strokeWidth="10">
          <path d="M0 120L600 380" />
          <path d="M80 0L420 520" />
          <path d="M0 330L600 300" />
        </g>
        <g stroke="#fff" strokeWidth="4">
          <path d="M0 60L600 80M0 200L600 220M0 450L600 430M200 0L180 520M480 0L500 520" />
        </g>
        <path d="M600 40L360 520" stroke="#C9D9CF" strokeWidth="22" />
        <g
          fill="none"
          stroke="#00704A"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        >
          <circle cx="300" cy="260" r="60" />
          <circle cx="300" cy="260" r="150" />
          <circle cx="300" cy="260" r="240" />
        </g>
        <g fontSize="11" fontWeight="700" fill="#00704A">
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
        <rect x="282" y="246" width="36" height="28" fill="#1A1A1A" />
        {hotels.map((hotel, index) => {
          const { x, y } = markerOrigin(hotel, index);
          return (
            <g key={hotel.slug} fontWeight="800" fontSize="13">
              <rect x={x} y={y} width="22" height="22" fill="#1A1A1A" />
              <text x={x + 11} y={y + 16} textAnchor="middle" fill="#fff">
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="map-caption">
        {venueName} · anillos 1 / 3 / 5 km · plano esquemático
      </div>
    </div>
  );
}
