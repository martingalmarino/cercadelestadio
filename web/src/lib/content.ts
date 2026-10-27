import citiesJson from "../../content/cities.json";
import eventsJson from "../../content/events.json";
import hotelsJson from "../../content/hotels.json";
import venuesJson from "../../content/venues.json";
import { byDate, upcomingEvents } from "@/lib/events";
import type { City, Hotel, ShowEvent, Venue } from "@/lib/types";

const cities = citiesJson as City[];
const venues = venuesJson as Venue[];
const hotels = hotelsJson as Hotel[];
const events = (eventsJson as ShowEvent[]).slice().sort(byDate);

for (const hotel of hotels) {
  if (hotel.example !== true) {
    throw new Error(`El hotel ${hotel.slug} tiene que estar marcado como ejemplo.`);
  }
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
  const list = hotelsFor(venueSlug);
  if (list.length === 0) return null;
  return Math.min(...list.map((hotel) => hotel.pricePerNight));
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
