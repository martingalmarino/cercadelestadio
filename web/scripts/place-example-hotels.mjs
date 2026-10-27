import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import destination from "@turf/destination";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "content");
const venuesPath = path.join(root, "venues.json");
const hotelsPath = path.join(root, "hotels.json");

const venues = [
  {
    slug: "estadio-monumental",
    lat: -34.54529,
    lng: -58.44974,
    osm: { type: "relation", id: 1646999 },
  },
  {
    slug: "movistar-arena",
    lat: -34.5942604,
    lng: -58.4481368,
    osm: { type: "way", id: 702175944 },
  },
  {
    slug: "jose-amalfitani",
    lat: -34.6353382,
    lng: -58.5206788,
    osm: { type: "way", id: 23243149 },
  },
  {
    slug: "tomas-duco",
    lat: -34.6434539,
    lng: -58.3965026,
    osm: { type: "relation", id: 17351933 },
  },
  {
    slug: "mario-kempes",
    lat: -31.3688468,
    lng: -64.2461451,
    osm: { type: "way", id: 154248210 },
  },
  {
    slug: "estadio-unico-la-plata",
    lat: -34.9138408,
    lng: -57.9890476,
    osm: { type: "way", id: 119937010 },
  },
];

const bearings = [-50, 40, -130, 150, 100, -20];

function round(value) {
  return Math.round(value * 1e6) / 1e6;
}

const venueList = JSON.parse(readFileSync(venuesPath, "utf8"));
const bySlug = new Map(venues.map((venue) => [venue.slug, venue]));

for (const venue of venueList) {
  const place = bySlug.get(venue.slug);
  if (!place) throw new Error(`Falta coordenada para ${venue.slug}`);
  venue.lat = place.lat;
  venue.lng = place.lng;
  venue.osm = place.osm;
}

const hotels = JSON.parse(readFileSync(hotelsPath, "utf8"));
const seen = new Map();

for (const hotel of hotels) {
  const venue = bySlug.get(hotel.venueSlug);
  if (!venue) throw new Error(`Hotel sin estadio: ${hotel.slug}`);
  const index = seen.get(hotel.venueSlug) ?? 0;
  seen.set(hotel.venueSlug, index + 1);
  const point = destination([venue.lng, venue.lat], hotel.distanceKm, bearings[index % bearings.length], {
    units: "kilometers",
  });
  const [lng, lat] = point.geometry.coordinates;
  hotel.lat = round(lat);
  hotel.lng = round(lng);
}

writeFileSync(venuesPath, `${JSON.stringify(venueList, null, 2)}\n`);
writeFileSync(hotelsPath, `${JSON.stringify(hotels, null, 2)}\n`);
console.log(`venues ${venueList.length}, hotels ${hotels.length}`);
