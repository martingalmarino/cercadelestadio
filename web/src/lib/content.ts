import { readFileSync } from "node:fs";
import path from "node:path";
import citiesJson from "../../content/cities.json";
import eventsJson from "../../content/events.json";
import hotelsJson from "../../content/hotels.json";
import venuesJson from "../../content/venues.json";
import { byDate, upcomingEvents } from "@/lib/events";
import type { City, Hotel, ShowEvent, Venue, VenueOutline } from "@/lib/types";

const cities = citiesJson as City[];
const venues = venuesJson as Venue[];
const events = (eventsJson as ShowEvent[]).slice().sort(byDate);

const bookingStatuses = new Set(["ficha", "busqueda-geo", "no-en-booking"]);
const loadedHotels = hotelsJson as Hotel[];

for (const hotel of loadedHotels) {
  if (hotel.source !== "osm") {
    throw new Error(`El hotel ${hotel.slug} tiene que venir de OpenStreetMap.`);
  }
  if (typeof hotel.lat !== "number" || typeof hotel.lng !== "number") {
    throw new Error(`El hotel ${hotel.slug} necesita latitud y longitud numéricas.`);
  }
  if (!bookingStatuses.has(hotel.bookingStatus)) {
    throw new Error(`El hotel ${hotel.slug} necesita un bookingStatus válido.`);
  }
}

const hotels = loadedHotels.filter((hotel) => {
  if (hotel.bookingStatus === "no-en-booking") return false;
  if (hotel.bookingStatus === "ficha" && !hotel.bookingUrl) return false;
  return true;
});

for (const venue of venues) {
  venue.hotelsWithin3km = hotels.filter(
    (hotel) => hotel.venueSlug === venue.slug && hotel.distanceKm <= 3,
  ).length;
}

const venueBySlug = new Map(venues.map((venue) => [venue.slug, venue]));
const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
const eventBySlug = new Map(events.map((event) => [event.slug, event]));

export function getCities() {
  return cities;
}

export function getVenues() {
  return venues;
}

export function getEvents() {
  return events;
}

export function getCity(slug: string) {
  return cityBySlug.get(slug) ?? null;
}

export function getVenue(slug: string) {
  return venueBySlug.get(slug) ?? null;
}

export function getEvent(slug: string) {
  return eventBySlug.get(slug) ?? null;
}

export function getVenueOutline(slug: string): VenueOutline | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    const file = path.join(process.cwd(), "content", "outlines", `${slug}.geojson`);
    const parsed = JSON.parse(readFileSync(file, "utf8")) as VenueOutline;
    const kind = parsed.geometry?.type;
    if (parsed.type !== "Feature" || (kind !== "Polygon" && kind !== "MultiPolygon")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hotelsFor(venueSlug: string) {
  return hotels
    .filter((hotel) => hotel.venueSlug === venueSlug)
    .slice()
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function venuesForCity(citySlug: string) {
  return venues.filter((venue) => venue.citySlug === citySlug);
}

export function eventsForVenue(venueSlug: string) {
  return events.filter((event) => event.venueSlug === venueSlug).sort(byDate);
}

export function eventsForCity(citySlug: string) {
  return events.filter((event) => event.citySlug === citySlug).sort(byDate);
}

export function minNightlyPrice(venueSlug: string) {
  const prices = hotelsFor(venueSlug)
    .map((hotel) => hotel.pricePerNight)
    .filter((price): price is number => price != null);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export function cityDetail(citySlug: string) {
  const count = venuesForCity(citySlug).length;
  if (count === 1) return "1 estadio";
  if (count > 1) return `${count} estadios`;
  if (eventsForCity(citySlug).length > 0) return "Próximos eventos";
  return "Próximamente";
}

export function upcomingForVenue(venueSlug: string, nowMs: number) {
  return upcomingEvents(eventsForVenue(venueSlug), nowMs);
}

export function upcomingForCity(citySlug: string, nowMs: number) {
  return upcomingEvents(eventsForCity(citySlug), nowMs);
}
