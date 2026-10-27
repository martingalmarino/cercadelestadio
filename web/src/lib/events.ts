import { baDate } from "@/lib/format";
import type { ShowEvent } from "@/lib/types";

export function isFinished(eventDate: string, nowMs: number) {
  return baDate(nowMs) > eventDate;
}

export function byDate(a: ShowEvent, b: ShowEvent) {
  return a.date.localeCompare(b.date) || a.artist.localeCompare(b.artist);
}

export function upcomingEvents(events: ShowEvent[], nowMs: number) {
  return events.filter((event) => !isFinished(event.date, nowMs)).sort(byDate);
}

export function nextVenueEvent(
  events: ShowEvent[],
  current: ShowEvent,
  nowMs: number,
) {
  return (
    events
      .filter((event) => {
        if (event.slug === current.slug || isFinished(event.date, nowMs)) {
          return false;
        }
        if (current.venueSlug) {
          return event.venueSlug === current.venueSlug && event.date > current.date;
        }
        return event.citySlug === current.citySlug && event.date > current.date;
      })
      .sort(byDate)[0] ?? null
  );
}
