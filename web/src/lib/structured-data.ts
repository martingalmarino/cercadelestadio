import { existsSync } from "node:fs";
import path from "node:path";
import { absoluteUrl, siteUrl } from "@/lib/site";
import type { Hotel, ShowEvent, Venue } from "@/lib/types";

export type Crumb = { name: string; path: string };
type Node = Record<string, unknown>;

const BUILD_DATE = new Date().toISOString().slice(0, 10);

function orgId() {
  return `${siteUrl()}/#org`;
}

function websiteId() {
  return `${siteUrl()}/#website`;
}

export function stadiumId(venue: Pick<Venue, "slug">) {
  return `${absoluteUrl(`/estadio/${venue.slug}`)}#venue`;
}

export function eventId(event: Pick<ShowEvent, "slug">) {
  return `${absoluteUrl(`/evento/${event.slug}`)}#event`;
}

function modified(value?: string) {
  if (!value) return BUILD_DATE;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return BUILD_DATE;
  return parsed.toISOString().slice(0, 10);
}

export function organization(): Node {
  const logoFile = path.join(process.cwd(), "public", "icon.png");
  return {
    "@type": "Organization",
    "@id": orgId(),
    name: "cercadelestadio",
    url: siteUrl(),
    sameAs: [],
    ...(existsSync(logoFile)
      ? {
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/icon.png"),
          },
        }
      : {}),
  };
}

export function website(): Node {
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    name: "cercadelestadio",
    url: siteUrl(),
    inLanguage: "es-AR",
    publisher: { "@id": orgId() },
  };
}

export function webPage(input: {
  path: string;
  name: string;
  dateModified?: string;
  aboutId?: string;
}): Node {
  return {
    "@type": "WebPage",
    "@id": `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.name,
    inLanguage: "es-AR",
    isPartOf: { "@id": websiteId() },
    dateModified: modified(input.dateModified),
    ...(input.aboutId ? { about: { "@id": input.aboutId } } : {}),
  };
}

export function breadcrumbList(items: Crumb[]): Node | null {
  if (items.length < 2) return null;
  const page = items[items.length - 1]?.path ?? "/";
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(page)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function stadium(venue: Venue): Node {
  const names = [
    venue.nickname,
    venue.slug === "estadio-monumental" ? "Más Monumental" : null,
  ].filter((name): name is string => Boolean(name));
  return {
    "@type": "StadiumOrArena",
    "@id": stadiumId(venue),
    name: venue.seoName,
    ...(names.length > 1
      ? { alternateName: names }
      : names.length === 1
        ? { alternateName: names[0] }
        : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.street,
      addressLocality: venue.locality,
      addressRegion: venue.region,
      addressCountry: "AR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: venue.lat,
      longitude: venue.lng,
    },
    ...(venue.draft ? {} : { maximumAttendeeCapacity: venue.capacity }),
    url: absoluteUrl(`/estadio/${venue.slug}`),
    ...(venue.osm
      ? { hasMap: `https://www.openstreetmap.org/${venue.osm.type}/${venue.osm.id}` }
      : {}),
  };
}

function isSports(type: string) {
  return /partido|deporte|f[uú]tbol/i.test(type);
}

function durationMinutes(duration: string) {
  const hours = duration.match(/(\d+)\s*h/i);
  const minutes = duration.match(/(\d+)\s*min/i);
  if (!hours && !minutes) return null;
  return (hours ? Number(hours[1]) : 0) * 60 + (minutes ? Number(minutes[1]) : 0);
}

function plusMinutes(date: string, time: string, minutes: number) {
  const start = new Date(`${date}T${time}:00-03:00`);
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(end)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-03:00`;
}

function eventStatus(status: ShowEvent["status"]) {
  if (status === "cancelled") return "https://schema.org/EventCancelled";
  if (status === "rescheduled") return "https://schema.org/EventRescheduled";
  return "https://schema.org/EventScheduled";
}

export function concertEvent(input: {
  event: ShowEvent;
  venue: Venue | null;
  cityName: string;
  description: string;
}): Node | null {
  const { event, venue } = input;
  if (!event.dateExact) return null;

  const sports = isSports(event.type);
  const withTime = Boolean(event.showTime);
  const startDate = withTime
    ? `${event.date}T${event.showTime}:00-03:00`
    : event.date;
  const extraMinutes = event.duration ? durationMinutes(event.duration) : null;
  const endDate =
    withTime && event.showTime
      ? plusMinutes(event.date, event.showTime, extraMinutes ?? 180)
      : event.date;
  const place = venue ? venue.seoName : input.cityName;

  return {
    "@type": sports ? "SportsEvent" : "MusicEvent",
    "@id": eventId(event),
    name: `${event.artist} en ${place}`,
    description: input.description,
    startDate,
    endDate,
    eventStatus: eventStatus(event.status),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: absoluteUrl(`/evento/${event.slug}`),
    inLanguage: "es-AR",
    performer: {
      "@type": sports
        ? "SportsTeam"
        : event.performerType === "person"
          ? "Person"
          : "MusicGroup",
      name: event.artist,
    },
    location: venue
      ? stadium(venue)
      : {
          "@type": "Place",
          name: input.cityName,
          address: {
            "@type": "PostalAddress",
            addressLocality: input.cityName,
            addressCountry: "AR",
          },
        },
    ...(event.ticketUrl
      ? {
          offers: {
            "@type": "Offer",
            url: event.ticketUrl,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export function hotelItemList(name: string, hotels: Hotel[]): Node | null {
  if (hotels.length === 0) return null;
  return {
    "@type": "ItemList",
    name,
    itemListElement: hotels.map((hotel, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": hotel.kind === "hostel" ? "Hostel" : "Hotel",
        name: hotel.name,
        geo: {
          "@type": "GeoCoordinates",
          latitude: hotel.lat,
          longitude: hotel.lng,
        },
        ...(hotel.address
          ? {
              address: {
                "@type": "PostalAddress",
                streetAddress: hotel.address,
                ...(hotel.city ? { addressLocality: hotel.city } : {}),
                addressCountry: "AR",
              },
            }
          : {}),
        ...(hotel.website ? { url: hotel.website } : {}),
        ...(hotel.stars != null
          ? {
              starRating: {
                "@type": "Rating",
                ratingValue: hotel.stars,
              },
            }
          : {}),
      },
    })),
  };
}

export function eventItemList(
  name: string,
  events: { name: string; path: string }[],
): Node | null {
  if (events.length === 0) return null;
  return {
    "@type": "ItemList",
    name,
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: event.name,
        url: absoluteUrl(event.path),
      },
    })),
  };
}

export function faqPage(
  items: { question: string; answer: string }[],
  pagePath: string,
): Node | null {
  if (items.length === 0) return null;
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(pagePath)}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function placeItemList(
  name: string,
  places: { name: string; path: string }[],
): Node | null {
  if (places.length === 0) return null;
  return {
    "@type": "ItemList",
    name,
    itemListElement: places.map((place, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Place",
        name: place.name,
        url: absoluteUrl(place.path),
      },
    })),
  };
}
