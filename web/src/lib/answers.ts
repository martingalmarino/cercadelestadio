import { formatFullDate, formatKm, monthName, weekdayName } from "@/lib/format";
import { alVenue, deVenue, enVenue } from "@/lib/seo";
import type { Hotel, ShowEvent, Venue } from "@/lib/types";

export type FaqItem = { question: string; answer: string };

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function accessSentence(venue: Venue) {
  if (/subte/i.test(venue.accessLabel)) {
    return `Se llega en Subte ${venue.accessValue.replace(/^Línea\s+/i, "")}.`;
  }
  if (/tren/i.test(venue.accessLabel)) {
    return `Se llega en Tren ${venue.accessValue}.`;
  }
  return `Se llega en ${venue.accessValue}.`;
}

function firstSentence(text: string) {
  const match = text.match(/^.*?[.!?]/);
  return (match?.[0] ?? text).trim();
}

export function venueAnswer(venue: Venue, hotels: Hotel[]) {
  const nearest = hotels[0];
  const near = nearest
    ? `El más cercano está a ${formatKm(nearest.distanceKm)}, unos ${nearest.walkMinutes} minutos a pie.`
    : "El hotel más cercano está a confirmar.";
  const core = `A 3 km ${deVenue(venue)} hay ${venue.hotelsWithin3km} hoteles. ${near} ${accessSentence(venue)}`;
  const back = firstSentence(venue.returnAdvice.text);
  const full = `${core} ${back}`;
  if (words(full).length <= 60) return full;
  return `${core} Para volver: ${venue.returnAdvice.title}.`;
}

export function eventAnswer(
  event: ShowEvent,
  venue: Venue | null,
  cityName: string,
  hotels: Hotel[],
) {
  if (!venue) {
    return `A 3 km del show de ${event.artist} en ${cityName} la distancia está a confirmar. La línea de transporte también está a confirmar, porque el recinto no está definido.`;
  }
  return venueAnswer(venue, hotels);
}

export function cityAnswer(cityName: string, venues: Venue[]) {
  const hotels = venues.reduce((sum, venue) => sum + venue.hotelsWithin3km, 0);
  const modes = new Set<string>();
  for (const venue of venues) {
    if (/subte/i.test(venue.accessLabel)) modes.add("subte");
    else if (/tren/i.test(venue.accessLabel)) modes.add("tren");
    else modes.add(venue.accessValue.toLowerCase());
  }
  const transport = modes.size > 0 ? [...modes].join(", ") : "transporte a confirmar";
  const count = venues.length === 1 ? "1 estadio" : `${venues.length} estadios`;
  return `En ${cityName} hay ${count} y ${hotels} hoteles a 3 km. Para llegar se usa ${transport}.`;
}

function arrivalAnswer(venue: Venue) {
  const steps = venue.transit.filter((step) => !step.highlight);
  const blob = steps.map((step) => `${step.title} ${step.detail}`).join(" ");
  const hasSubte = /subte|l[ií]nea/i.test(blob);
  const hasColectivo = /colectivo/i.test(blob);
  const mode = hasSubte
    ? hasColectivo
      ? "Hay subte y colectivos."
      : "Hay subte. Esta ficha no carga una línea de colectivo."
    : hasColectivo
      ? "No hay subte. Se llega en colectivo."
      : "Subte y colectivo están a confirmar.";
  const facts = steps.slice(0, 2).map((step) => {
    const place = step.title || "El acceso";
    return step.label ? `${place} (${step.label}): ${step.detail}` : `${place}: ${step.detail}`;
  });
  return [mode, ...facts].join(" ");
}

export function venueFaqs(venue: Venue, hotels: Hotel[]): FaqItem[] {
  const nearest = hotels[0];
  const hotelsAnswer = nearest
    ? `A 3 km ${deVenue(venue)} hay ${venue.hotelsWithin3km} hoteles. El más cercano de esta guía está a ${formatKm(nearest.distanceKm)}, unos ${nearest.walkMinutes} minutos a pie, en ${nearest.neighborhood}.`
    : `A 3 km ${deVenue(venue)} figuran ${venue.hotelsWithin3km} hoteles. El más cercano está a confirmar.`;
  const first = venue.neighborhoods[0];
  const third = venue.neighborhoods[2] ?? venue.neighborhoods[1];
  const areas =
    first && third
      ? `${first.name}: ${first.summary} ${third.name}: ${third.summary}`
      : "Los barrios para dormir están a confirmar.";
  return [
    {
      question: `¿Qué hoteles hay cerca ${deVenue(venue)}?`,
      answer: hotelsAnswer,
    },
    {
      question: `¿Cómo llegar ${alVenue(venue)} en subte o colectivo?`,
      answer: arrivalAnswer(venue),
    },
    {
      question: `¿Cómo volver ${deVenue(venue)} después del recital?`,
      answer: venue.returnAdvice.text,
    },
    {
      question: `¿A qué hora termina un recital ${enVenue(venue)}?`,
      answer: "A confirmar. Depende de cada show; esta ficha no publica una hora de final.",
    },
    {
      question: `¿Conviene dormir en ${first?.name ?? "el barrio"} o ${third?.name ?? "otro barrio"}?`,
      answer: areas,
    },
  ];
}

function whenAnswer(event: ShowEvent, place: string) {
  if (!event.dateExact) {
    return `${event.artist} en ${place} es en ${monthName(event.date)} de ${event.date.slice(0, 4)}. El día está a confirmar.`;
  }
  return `${event.artist} en ${place} es el ${weekdayName(event.date)} ${formatFullDate(event.date)}.`;
}

export function eventFaqs(
  event: ShowEvent,
  venue: Venue | null,
  place: string,
  hotels: Hotel[],
): FaqItem[] {
  const nearest = hotels[0];
  const sleep = !venue
    ? "A confirmar. El recinto todavía no está definido, así que no hay distancias."
    : nearest
      ? `A 3 km ${deVenue(venue)} hay ${venue.hotelsWithin3km} hoteles. El más cercano está a ${formatKm(nearest.distanceKm)}, unos ${nearest.walkMinutes} minutos a pie.`
      : `Hay ${venue.hotelsWithin3km} hoteles a 3 km. El más cercano está a confirmar.`;
  const back = venue
    ? venue.returnAdvice.text
    : "A confirmar. Sin recinto no hay un regreso cargado.";
  return [
    {
      question: `¿Cuándo es ${event.artist} en ${place}?`,
      answer: whenAnswer(event, place),
    },
    {
      question: "¿A qué hora abren las puertas?",
      answer: event.doors ? `Las puertas abren a las ${event.doors}.` : "A confirmar.",
    },
    {
      question: `¿Dónde dormir para ${event.artist}?`,
      answer: sleep,
    },
    {
      question: "¿Cómo volver después del show?",
      answer: back,
    },
  ];
}
