import { readFileSync } from "node:fs";
import path from "node:path";
import { isImportantMatch } from "../football";
import { matchVenue } from "../normalize";
import type { IngestSource, RawEvent } from "../types";

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

function clock(value: string | null | undefined) {
  const match = value?.match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  if (match[1] === "00" && match[2] === "00") return null;
  return `${match[1]}:${match[2]}`;
}

export function sportsEvents(payload: SportsPayload, aliases: Record<string, string[]>) {
  const raw: RawEvent[] = [];
  for (const event of payload.events ?? []) {
    const home = event.strHomeTeam?.trim();
    const away = event.strAwayTeam?.trim();
    const venue = event.strVenue?.trim();
    const date = event.dateEventLocal || event.dateEvent;
    if (!home || !away || !venue || !date || !event.idEvent) continue;
    if (!isImportantMatch(home, away)) continue;
    if (!matchVenue(venue, aliases)) continue;
    const time = clock(event.strTimeLocal) || clock(event.strTime);
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
    const url = `https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/eventsnextleague.php?id=4406`;
    let text: string;
    try {
      text = await ctx.fetchText(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "error desconocido";
      throw new Error(message.replaceAll(key, "…"));
    }
    return sportsEvents(JSON.parse(text) as SportsPayload, aliases());
  },
};
