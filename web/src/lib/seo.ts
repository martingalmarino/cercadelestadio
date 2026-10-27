import { formatFullDate, monthName, withArticle } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import type { ShowEvent, TimelineStep, Venue } from "@/lib/types";
import type { Metadata } from "next";

const BRAND = " | cercadelestadio";

export function withBrand(title: string) {
  const branded = `${title}${BRAND}`;
  if (branded.length <= 60) return { absolute: branded };
  return { absolute: title };
}

export function openGraphPage(
  title: string | { absolute: string },
  description: string,
  path: string,
): Metadata["openGraph"] {
  return {
    title: typeof title === "string" ? title : title.absolute,
    description,
    url: absoluteUrl(path),
    siteName: "cercadelestadio",
    locale: "es_AR",
    type: "website",
  };
}

function cercaDe(name: string) {
  const articulated = withArticle(name);
  if (articulated.startsWith("el ")) return `d${articulated}`;
  return `del ${articulated}`;
}

export function deVenue(venue: Pick<Venue, "seoName">) {
  return cercaDe(venue.seoName);
}

export function alVenue(venue: Pick<Venue, "seoName">) {
  const articulated = withArticle(venue.seoName);
  if (articulated.startsWith("el ")) return `al ${articulated.slice(3)}`;
  return `al ${articulated}`;
}

export function enVenue(venue: Pick<Venue, "seoName">) {
  const articulated = withArticle(venue.seoName);
  return articulated.startsWith("el ") ? `en ${articulated}` : `en el ${articulated}`;
}

export function venueTitle(venue: Pick<Venue, "seoName">) {
  return `Hoteles cerca ${cercaDe(venue.seoName)}`;
}

export function eventPlace(venue: Pick<Venue, "seoName"> | null, cityName: string) {
  if (!venue) return cityName;
  const short = venue.seoName.replace(/^Estadio\s+/u, "");
  const articulated = withArticle(short);
  return articulated.startsWith("el ") ? articulated : `el ${articulated}`;
}

export function eventTitle(
  event: Pick<ShowEvent, "artist" | "date">,
  venue: Pick<Venue, "seoName"> | null,
  cityName: string,
) {
  const year = event.date.slice(0, 4);
  return `Hoteles para ${event.artist} en ${eventPlace(venue, cityName)} ${year}`;
}

export function cityTitle(city: { name: string }) {
  return `Hoteles cerca de estadios en ${city.name}`;
}

export function clampMeta(text: string) {
  if (
    process.env.NODE_ENV === "development" &&
    (text.length < 140 || text.length > 155)
  ) {
    console.warn(`Meta fuera de 140–155 (${text.length}): ${text}`);
  }
  return text;
}

function pushUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

function transportPhrase(steps: TimelineStep[]) {
  const found: string[] = [];
  for (const step of steps) {
    if (step.highlight) continue;
    const text = `${step.title} ${step.detail}`;
    const subte = step.badges?.find((badge) => badge.tone === "D");
    if (subte && /subte|l[ií]nea/i.test(text)) {
      pushUnique(found, `Subte ${subte.label}`);
      continue;
    }
    if (/mitre/i.test(text)) {
      pushUnique(found, "Tren Mitre");
      continue;
    }
    if (/sarmiento/i.test(text)) {
      pushUnique(found, "Tren Sarmiento");
      continue;
    }
    if (/roca/i.test(text)) {
      pushUnique(found, "tren Roca");
      continue;
    }
    if (/colectivo/i.test(text)) pushUnique(found, "colectivos");
  }
  if (found.length === 0) return "transporte público";
  if (found.length === 1) return found[0];
  return `${found[0]} y ${found[1]}`;
}

function inRange(text: string) {
  return text.length >= 140 && text.length <= 155;
}

function prefer(options: string[]) {
  const fit = options.find(inRange);
  if (fit) return fit;
  return options.slice().sort((a, b) => {
    const distance = (text: string) => {
      if (text.length < 140) return 140 - text.length;
      if (text.length > 155) return text.length - 155;
      return 0;
    };
    return distance(a) - distance(b) || a.length - b.length;
  })[0];
}

export function venueDescription(venue: Venue) {
  const place = cercaDe(venue.seoName);
  const transport = transportPhrase(venue.transit);
  const tail = `con mapa, cómo llegar en ${transport}, cómo volver después del show y cortes de calle.`;
  const chosen = prefer([
    `Hoteles a 1, 3 y 5 km ${place} en ${venue.neighborhood}, ${tail}`,
    `Hoteles a 1, 3 y 5 km ${place}, ${tail}`,
  ]);
  if (chosen.length >= 140 || !transport.startsWith("Subte ")) return clampMeta(chosen);
  const padded = chosen.replace(`en ${transport}`, `en el ${transport}`);
  return clampMeta(padded.length <= 155 ? padded : chosen);
}

function eventWhen(event: Pick<ShowEvent, "date" | "dateExact">) {
  if (!event.dateExact) {
    return `en ${monthName(event.date)} de ${event.date.slice(0, 4)}`;
  }
  return `el ${formatFullDate(event.date)}`;
}

export function eventDescription(
  event: ShowEvent,
  venue: Venue | null,
  cityName: string,
) {
  const when = eventWhen(event);
  const place = eventPlace(venue, cityName);
  const full = `Dónde dormir para ver a ${event.artist} en ${place} ${when}: hoteles por distancia, cómo llegar, a qué hora salir y cómo volver tras el recital.`;
  if (!venue) return clampMeta(full);
  const transport = transportPhrase(venue.transit);
  const where = venue.nickname ?? place;
  const short = venue.seoName.replace(/^Estadio\s+/u, "").replace(/\s+\([^)]+\)$/u, "");
  const compact = `Dónde dormir para ver a ${event.artist} en ${where} ${when}: hoteles por distancia al ${short}, cómo llegar en ${transport} y cómo volver.`;
  return clampMeta(
    prefer([
      full,
      compact.replace("y cómo volver.", "y cómo volver después."),
      compact,
    ]),
  );
}

export function cityDescription(city: { name: string }) {
  return clampMeta(
    `Estadios y recitales en ${city.name} con hoteles ordenados por distancia, cómo llegar a cada estadio y próximas fechas. Elegí dónde dormir cerca del show.`,
  );
}

export function venueIntro(venue: Venue) {
  if (venue.seoName === "Estadio Monumental" && venue.nickname) {
    return `Más Monumental, la cancha de ${venue.nickname}, en ${venue.neighborhood}`;
  }
  if (venue.nickname) {
    return `La cancha de ${venue.nickname}, en ${venue.neighborhood}`;
  }
  return venue.address;
}
