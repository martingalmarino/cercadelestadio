import { readFileSync } from "node:fs";
import path from "node:path";
import { baDate } from "../../../src/lib/format";
import { matchVenue } from "../normalize";
import type { IngestSource, RawEvent } from "../types";

const LEAGUE_ID = "4406";
const ARGENTINA_ID = "134509";
const MAX_ROUNDS = 30;
const PAUSE_MS = 2500;
const RATE_LIMIT_WAIT_MS = 65_000;

type SportsEvent = {
  idEvent?: string;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  strVenue?: string | null;
  strCity?: string | null;
  dateEvent?: string | null;
  dateEventLocal?: string | null;
  strTime?: string | null;
  strTimeLocal?: string | null;
};

export type SportsPayload = {
  events?: SportsEvent[] | null;
};

type LeaguePayload = {
  leagues?: { strCurrentSeason?: string | null }[] | null;
};

export type SportsRead = {
  read: number;
  matched: number;
};

let sportsRead: SportsRead | null = null;

export function lastSportsRead() {
  return sportsRead;
}

function clock(value: string | null | undefined) {
  const match = value?.match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  if (match[1] === "00" && match[2] === "00") return null;
  return `${match[1]}:${match[2]}`;
}

function eventDate(event: SportsEvent) {
  return event.dateEvent || event.dateEventLocal || "";
}

export function sportsEvents(payload: SportsPayload, aliases: Record<string, string[]>) {
  const raw: RawEvent[] = [];
  for (const event of payload.events ?? []) {
    const home = event.strHomeTeam?.trim();
    const away = event.strAwayTeam?.trim();
    const venue = event.strVenue?.trim();
    const date = event.dateEventLocal || event.dateEvent;
    if (!home || !away || !venue || !date || !event.idEvent) continue;
    if (!matchVenue(venue, aliases)) continue;
    const time = clock(event.strTimeLocal);
    raw.push({
      source: "thesportsdb",
      url: `https://www.thesportsdb.com/event/${event.idEvent}`,
      artistOrTitle: `${home} vs ${away}`,
      venueName: venue,
      city: event.strCity?.trim() || undefined,
      startsAt: time ? `${date}T${time}:00-03:00` : date,
      category: "partido",
      externalId: event.idEvent,
    });
  }
  return raw;
}

function dedupeEvents(events: SportsEvent[]) {
  const seen = new Set<string>();
  const unique: SportsEvent[] = [];
  for (const event of events) {
    const id = event.idEvent?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(event);
  }
  return unique;
}

function seasonOf(payload: unknown) {
  const season = (payload as LeaguePayload).leagues?.[0]?.strCurrentSeason?.trim() ?? "";
  if (!/^\d{4}(?:-\d{4})?$/.test(season)) {
    throw new Error("TheSportsDB no informó la temporada de la liga 4406.");
  }
  return season;
}

export async function gatherFixtures(input: {
  get: (path: string) => Promise<unknown>;
  today: string;
  pause?: () => Promise<void>;
}) {
  const pause =
    input.pause ??
    (() => new Promise<void>((resolve) => setTimeout(resolve, PAUSE_MS)));
  const season = seasonOf(await input.get(`lookupleague.php?id=${LEAGUE_ID}`));
  const collected: SportsEvent[] = [];
  let empty = 0;
  for (let round = 1; round <= MAX_ROUNDS; round += 1) {
    await pause();
    const payload = (await input.get(
      `eventsround.php?id=${LEAGUE_ID}&r=${round}&s=${encodeURIComponent(season)}`,
    )) as SportsPayload;
    if (payload.events == null) {
      empty += 1;
      if (empty >= 2) break;
      continue;
    }
    empty = 0;
    collected.push(...payload.events);
  }
  await pause();
  const national = (await input.get(`eventsnext.php?id=${ARGENTINA_ID}`)) as SportsPayload;
  collected.push(...(national.events ?? []));
  const unique = dedupeEvents(collected);
  return {
    season,
    read: unique.length,
    upcoming: unique.filter((event) => {
      const date = eventDate(event);
      return date !== "" && date >= input.today;
    }),
  };
}

export async function readSportsJson(
  fetchText: (url: string) => Promise<string>,
  url: string,
  key: string,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return JSON.parse(await fetchText(url)) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : "error desconocido";
      if (message.includes("HTTP 429") && attempt < 3) {
        console.log("TheSportsDB limitó el ritmo. Reintento en 65 segundos.");
        await wait(RATE_LIMIT_WAIT_MS);
        continue;
      }
      throw new Error(message.replaceAll(key, "…"));
    }
  }
  throw new Error("TheSportsDB limitó las consultas.");
}

function aliases() {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "content", "venue-aliases.json"), "utf8"),
  ) as Record<string, string[]>;
}

export const theSportsDb: IngestSource = {
  name: "thesportsdb",
  kind: "fixture",
  enabled: true,
  async fetch(ctx) {
    const key = process.env.THESPORTSDB_KEY?.trim() || "123";
    const base = `https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}`;
    sportsRead = null;
    const gathered = await gatherFixtures({
      today: baDate(ctx.now.getTime()),
      async get(apiPath) {
        return readSportsJson(ctx.fetchText, `${base}/${apiPath}`, key);
      },
    });
    const matched = sportsEvents({ events: gathered.upcoming }, aliases());
    sportsRead = { read: gathered.read, matched: matched.length };
    return matched;
  },
};
