import { baDate } from "@/lib/format";
import type { ShowEvent } from "@/lib/types";

export function isFinished(eventDate: string, nowMs: number) {
  return baDate(nowMs) > eventDate;
}

export function isPast(event: Pick<ShowEvent, "status">) {
  return event.status === "past";
}

export function daysSince(eventDate: string, nowMs: number) {
  const today = baDate(nowMs);
  return (Date.parse(`${today}T12:00:00Z`) - Date.parse(`${eventDate}T12:00:00Z`)) / 86_400_000;
}

export function isExpired(eventDate: string, nowMs: number) {
  return daysSince(eventDate, nowMs) > 90;
}

export function visibleEvents(events: ShowEvent[]) {
  return events.filter((event) => event.status !== "cancelled" && !isPast(event));
}

export function byDate(a: ShowEvent, b: ShowEvent) {
  return a.date.localeCompare(b.date) || a.artist.localeCompare(b.artist);
}

export function upcomingEvents(events: ShowEvent[], nowMs: number) {
  return visibleEvents(events)
    .filter((event) => !isFinished(event.date, nowMs))
    .sort(byDate);
}

export function scheduledEvents(events: ShowEvent[], nowMs: number) {
  return upcomingEvents(events, nowMs).filter((event) => event.status !== "announced");
}

export function announcedEvents(events: ShowEvent[]) {
  return events.filter((event) => event.status === "announced").sort(byDate);
}

export function upcomingAtVenue(
  events: ShowEvent[],
  venueSlug: string | null,
  nowMs: number,
  exceptSlug?: string,
) {
  if (!venueSlug) return [];
  return upcomingEvents(
    events.filter((event) => event.venueSlug === venueSlug && event.slug !== exceptSlug),
    nowMs,
  );
}

export function nextVenueEvent(
  events: ShowEvent[],
  current: ShowEvent,
  nowMs: number,
) {
  return (
    events
      .filter((event) => {
        if (
          event.slug === current.slug ||
          event.status === "cancelled" ||
          isPast(event) ||
          isFinished(event.date, nowMs)
        ) {
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
