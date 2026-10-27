import { describe, expect, it } from "vitest";
import type { ShowEvent } from "../../src/lib/types";
import { merge } from "./merge";
import type { NormalizedEvent } from "./types";

const now = new Date("2026-10-27T15:00:00-03:00");

function existing(overrides: Partial<ShowEvent> = {}): ShowEvent {
  return {
    slug: "mana-estadio-monumental",
    artist: "Maná",
    venueSlug: "estadio-monumental",
    citySlug: "buenos-aires",
    date: "2026-12-10",
    dateExact: true,
    doors: "18:00",
    showTime: "21:00",
    duration: "2 h 15 min",
    type: "Recital",
    category: "recital",
    status: "confirmed",
    plan: [{ label: "21:00", title: "Show", detail: "Empieza." }],
    sources: [
      {
        name: "movistar-arena",
        url: "https://example.com/a",
        firstSeen: "2026-01-01",
        lastSeen: "2026-01-02",
      },
    ],
    externalIds: { "movistar-arena": "abc" },
    ...overrides,
  };
}

function incoming(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
  return {
    artist: "Maná",
    venueSlug: "estadio-monumental",
    citySlug: "buenos-aires",
    date: "2026-12-10",
    showTime: "23:00",
    category: "recital",
    sources: [
      {
        name: "movistar-arena",
        url: "https://example.com/b",
        externalId: "abc",
        kind: "venue",
      },
    ],
    ...overrides,
  };
}

describe("merge", () => {
  it("no pisa campos editoriales y actualiza lastSeen", () => {
    const current = existing();
    const result = merge({
      existing: [current],
      incoming: [incoming()],
      state: { misses: {} },
      ranSources: ["movistar-arena"],
      now,
    });
    const event = result.events[0];
    expect(event.doors).toBe("18:00");
    expect(event.showTime).toBe("21:00");
    expect(event.duration).toBe("2 h 15 min");
    expect(event.plan).toEqual(current.plan);
    expect(event.sources?.[0]).toMatchObject({ firstSeen: "2026-01-01", lastSeen: "2026-10-27" });
    expect(result.cambiados).toEqual([]);
  });

  it("completa showTime solo si estaba vacío", () => {
    const result = merge({
      existing: [existing({ showTime: null })],
      incoming: [incoming({ showTime: "21:00" })],
      state: { misses: {} },
      ranSources: ["movistar-arena"],
      now,
    });
    expect(result.events[0].showTime).toBe("21:00");
    expect(result.cambiados[0].detail).toContain("showTime");
  });

  it("crea confirmed desde ticketera o venue, y announced desde una señal", () => {
    const ticketera = merge({
      existing: [],
      incoming: [incoming({ artist: "Nueva Banda", sources: [{ name: "ticketek", url: "https://ticketek.com/x", externalId: "t1", kind: "ticketera" }] })],
      state: { misses: {} },
      ranSources: ["ticketek"],
      now,
    });
    expect(ticketera.events[0].status).toBe("confirmed");
    expect(ticketera.nuevos).toHaveLength(1);

    const senal = merge({
      existing: [],
      incoming: [incoming({ artist: "Otra Banda", sources: [{ name: "prensa", url: "https://prensa.example/x", externalId: "p1", kind: "senal" }] })],
      state: { misses: {} },
      ranSources: ["prensa"],
      now,
    });
    expect(senal.events[0].status).toBe("announced");
  });

  it("marca past si la fecha ya pasó y no cancela un show que falta dos corridas", () => {
    const past = merge({
      existing: [existing({ date: "2026-10-01", status: "confirmed" })],
      incoming: [],
      state: { misses: {} },
      ranSources: [],
      now,
    });
    expect(past.events[0].status).toBe("past");
    expect(past.cambiados[0].detail).toBe("pasó a past");

    const cancelled = merge({
      existing: [existing({ date: "2026-10-01", status: "cancelled", sources: undefined })],
      incoming: [],
      state: { misses: {} },
      ranSources: ["movistar-arena"],
      now,
    });
    expect(cancelled.events[0].status).toBe("cancelled");

    const first = merge({
      existing: [existing()],
      incoming: [],
      state: { misses: {} },
      ranSources: ["movistar-arena"],
      now,
    });
    expect(first.revisar).toEqual([]);
    expect(first.state.misses["movistar-arena::mana-estadio-monumental"]).toBe(1);
    expect(first.events[0].status).toBe("confirmed");

    const second = merge({
      existing: first.events,
      incoming: [],
      state: first.state,
      ranSources: ["movistar-arena"],
      now,
    });
    expect(second.revisar).toHaveLength(1);
    expect(second.events[0].status).toBe("confirmed");
    expect(second.state.misses["movistar-arena::mana-estadio-monumental"]).toBe(2);
  });

  it("no cuenta una ausencia si la fuente no corrió", () => {
    const result = merge({
      existing: [existing()],
      incoming: [],
      state: { misses: { "movistar-arena::mana-estadio-monumental": 1 } },
      ranSources: [],
      now,
    });
    expect(result.state.misses["movistar-arena::mana-estadio-monumental"]).toBe(1);
    expect(result.revisar).toEqual([]);
  });
});
