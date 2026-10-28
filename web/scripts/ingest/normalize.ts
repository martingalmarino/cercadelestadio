import { readFile } from "node:fs/promises";
import path from "node:path";
import type { EventCategory } from "../../src/lib/types";
import { cleanName, fold, includesPhrase } from "./text";
import type { NormalizedEvent, RawEvent, SourceKind, UnmatchedEvent } from "./types";

const BA = "America/Argentina/Buenos_Aires";

const categories = new Set<EventCategory>(["recital", "partido", "festival"]);

const typeLabel: Record<EventCategory, string> = {
  recital: "Recital",
  partido: "Partido",
  festival: "Festival",
};

const cityAliases: Record<string, string> = {
  "buenos aires": "buenos-aires",
  caba: "buenos-aires",
  "capital federal": "buenos-aires",
  "ciudad autonoma de buenos aires": "buenos-aires",
  cordoba: "cordoba",
  mendoza: "mendoza",
  rosario: "rosario",
  "la plata": "la-plata",
  "mar del plata": "mar-del-plata",
};

export type VenueRef = { slug: string; citySlug: string };
export type CityRef = { slug: string; name: string };

export type NormalizeContext = {
  aliases: Record<string, string[]>;
  venues: VenueRef[];
  cities: CityRef[];
  kinds?: Record<string, SourceKind>;
};

type AliasHit = { phrase: string; venueSlug: string };

export function scheduleParts(iso: string) {
  const value = iso.trim();
  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(value);
  if (dateOnly) return { date: dateOnly[1], showTime: null as string | null };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(parsed);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  let hour = read("hour");
  if (hour === "24") hour = "00";
  const showTime = `${hour}:${read("minute")}`;
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    showTime: showTime === "00:00" ? null : showTime,
  };
}

export function typeFor(category: EventCategory) {
  return typeLabel[category];
}

function aliasIndex(aliases: Record<string, string[]>) {
  const hits: AliasHit[] = [];
  for (const [venueSlug, names] of Object.entries(aliases)) {
    for (const name of names) {
      const phrase = fold(name);
      if (phrase) hits.push({ phrase, venueSlug });
    }
  }
  hits.sort((a, b) => b.phrase.length - a.phrase.length || a.venueSlug.localeCompare(b.venueSlug));
  return hits;
}

const venueExclusions = ["jose fierro"];

export function matchVenue(venueName: string, aliases: Record<string, string[]>) {
  const folded = fold(venueName);
  if (!folded) return null;
  if (venueExclusions.some((phrase) => folded.includes(phrase))) return null;
  const hits = aliasIndex(aliases);
  const exact = hits.find((hit) => hit.phrase === folded);
  if (exact) return exact.venueSlug;
  const partial = hits.find((hit) => hit.phrase.length >= 4 && includesPhrase(folded, hit.phrase));
  return partial?.venueSlug ?? null;
}

export function matchCity(city: string | undefined, cities: CityRef[]) {
  if (!city) return null;
  const folded = fold(city);
  if (!folded) return null;
  const alias = cityAliases[folded];
  if (alias) return alias;
  return (
    cities.find((item) => fold(item.name) === folded || fold(item.slug) === folded)?.slug ?? null
  );
}

function kindOf(source: string, kinds: Record<string, SourceKind> | undefined): SourceKind {
  return kinds?.[source] ?? "senal";
}

export function normalize(raw: RawEvent[], ctx: NormalizeContext) {
  const matched: NormalizedEvent[] = [];
  const unmatched: UnmatchedEvent[] = [];
  const venues = new Map(ctx.venues.map((venue) => [venue.slug, venue.citySlug]));

  for (const item of raw) {
    const artist = cleanName(item.artistOrTitle);
    const venueName = cleanName(item.venueName);
    const schedule = scheduleParts(item.startsAt);
    const reasons: string[] = [];
    if (!artist) reasons.push("sin artista");
    if (!categories.has(item.category)) reasons.push("categoría inválida");
    if (!schedule) reasons.push("fecha inválida");
    const venueSlug = venueName ? matchVenue(venueName, ctx.aliases) : null;
    if (!venueSlug) reasons.push("no está en venue-aliases.json");
    const citySlug = venueSlug ? (venues.get(venueSlug) ?? null) : null;
    if (venueSlug && !citySlug) reasons.push("el alias no corresponde a un estadio cargado");
    if (!artist || !schedule || !venueSlug || !citySlug || !categories.has(item.category)) {
      unmatched.push({
        artist: artist || item.artistOrTitle,
        venueName: venueName || item.venueName,
        city: item.city,
        startsAt: item.startsAt,
        source: item.source,
        url: item.url,
        reason: reasons.join("; "),
      });
      continue;
    }
    matched.push({
      artist,
      venueSlug,
      citySlug,
      date: schedule.date,
      showTime: schedule.showTime,
      category: item.category,
      sources: [
        {
          name: item.source,
          url: item.url,
          externalId: item.externalId,
          kind: kindOf(item.source, ctx.kinds),
        },
      ],
    });
  }

  return { matched, unmatched };
}

export async function loadNormalizeContext(contentDir: string): Promise<NormalizeContext> {
  const [aliases, venues, cities] = await Promise.all([
    readFile(path.join(contentDir, "venue-aliases.json"), "utf8"),
    readFile(path.join(contentDir, "venues.json"), "utf8"),
    readFile(path.join(contentDir, "cities.json"), "utf8"),
  ]);
  return {
    aliases: JSON.parse(aliases) as Record<string, string[]>,
    venues: JSON.parse(venues) as VenueRef[],
    cities: JSON.parse(cities) as CityRef[],
  };
}
