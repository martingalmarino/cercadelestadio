import { describe, expect, it } from "vitest";
import { announcedEvents, daysSince, isExpired, scheduledEvents } from "../../src/lib/events";
import { concertEvent } from "../../src/lib/structured-data";
import type { ShowEvent } from "../../src/lib/types";

const now = Date.parse("2026-10-27T15:00:00Z");

function event(patch: Partial<ShowEvent>): ShowEvent {
  return {
    slug: "show",
    artist: "Artista",
    venueSlug: "movistar-arena",
    citySlug: "buenos-aires",
    date: "2026-12-01",
    dateExact: true,
    doors: null,
    showTime: null,
    type: "Recital",
    category: "recital",
    status: "confirmed",
    ...patch,
  };
}

describe("expiración", () => {
  it("deja indexado el día 90 y saca el día 91", () => {
    expect(daysSince("2026-07-29", now)).toBe(90);
    expect(isExpired("2026-07-29", now)).toBe(false);
    expect(daysSince("2026-07-28", now)).toBe(91);
    expect(isExpired("2026-07-28", now)).toBe(true);
  });

  it("separa los anunciados de la lista visible", () => {
    const events = [
      event({ slug: "confirmado", status: "confirmed" }),
      event({ slug: "anuncio", artist: "Anuncio", status: "announced", dateExact: false }),
      event({ slug: "pasado", status: "past", date: "2026-01-01" }),
      event({ slug: "cancelado", status: "cancelled" }),
    ];
    expect(scheduledEvents(events, now).map((item) => item.slug)).toEqual(["confirmado"]);
    expect(announcedEvents(events).map((item) => item.slug)).toEqual(["anuncio"]);
  });
});

describe("eventStatus", () => {
  it("mapea el estado del show", () => {
    const status = (value: ShowEvent["status"]) =>
      concertEvent({
        event: event({ status: value }),
        venue: null,
        cityName: "Buenos Aires",
        description: "Dónde dormir.",
      })?.eventStatus;
    expect(status("confirmed")).toBe("https://schema.org/EventScheduled");
    expect(status("announced")).toBe("https://schema.org/EventScheduled");
    expect(status("past")).toBe("https://schema.org/EventScheduled");
    expect(status("cancelled")).toBe("https://schema.org/EventCancelled");
    expect(status("rescheduled")).toBe("https://schema.org/EventRescheduled");
  });
});
