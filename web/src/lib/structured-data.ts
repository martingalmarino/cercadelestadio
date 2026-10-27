import { countdownTarget } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import type { Hotel, ShowEvent, Venue } from "@/lib/types";

export type Crumb = { name: string; path: string };

export function breadcrumbList(items: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function hotelItemList(name: string, hotels: Hotel[], place: string) {
  return {
    "@type": "ItemList",
    name,
    itemListElement: hotels.map((hotel, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Hotel",
        name: hotel.name,
        description: "Ejemplo de referencia por distancia. No es un hotel real.",
        address: {
          "@type": "PostalAddress",
          addressLocality: hotel.neighborhood,
          addressRegion: place,
          addressCountry: "AR",
        },
      },
    })),
  };
}

export function eventItemList(
  name: string,
  events: { name: string; path: string; startDate: string }[],
) {
  return {
    "@type": "ItemList",
    name,
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: event.name,
        startDate: event.startDate,
        url: absoluteUrl(event.path),
      },
    })),
  };
}

export function faqPage(items: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
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

export function concertEvent(input: {
  name: string;
  path: string;
  startDate: string;
  description: string;
  finished: boolean;
  venue: Venue | null;
  cityName: string;
  artist: string;
}) {
  return {
    "@type": "Event",
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(input.finished
      ? {}
      : { eventStatus: "https://schema.org/EventScheduled" }),
    url: absoluteUrl(input.path),
    performer: {
      "@type": "PerformingGroup",
      name: input.artist,
    },
    location: {
      "@type": "Place",
      name: input.venue?.name ?? input.cityName,
      address: input.venue?.address ?? input.cityName,
    },
  };
}

export function placeItemList(
  name: string,
  places: { name: string; path: string }[],
) {
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

export function venueEventList(events: ShowEvent[], venueName: string) {
  return eventItemList(
    `Próximos eventos en ${venueName}`,
    events.map((event) => ({
      name: event.artist,
      path: `/evento/${event.slug}`,
      startDate: countdownTarget(event),
    })),
  );
}
