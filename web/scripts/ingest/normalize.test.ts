import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalize, scheduleParts, type NormalizeContext } from "./normalize";
import type { RawEvent } from "./types";

const ctx: NormalizeContext = {
  aliases: {
    "estadio-monumental": ["River Plate", "Mas Monumental", "Estadio Monumental"],
  },
  venues: [{ slug: "estadio-monumental", citySlug: "buenos-aires" }],
  cities: [{ slug: "buenos-aires", name: "Buenos Aires" }],
  kinds: { movistar: "venue", prensa: "senal" },
};

function raw(overrides: Partial<RawEvent> = {}): RawEvent {
  return {
    source: "movistar",
    url: "https://www.movistararena.com.ar/show/1",
    artistOrTitle: "  Maná  ",
    venueName: "Mas Monumental",
    startsAt: "2026-12-10T21:00:00-03:00",
    category: "recital",
    externalId: "1",
    ...overrides,
  };
}

describe("normalize", () => {
  it("limpia el nombre y mapea el venue", () => {
    const result = normalize([raw()], ctx);
    expect(result.unmatched).toEqual([]);
    expect(result.matched).toEqual([
      expect.objectContaining({
        artist: "Maná",
        venueSlug: "estadio-monumental",
        citySlug: "buenos-aires",
        date: "2026-12-10",
        showTime: "21:00",
        category: "recital",
      }),
    ]);
    expect(result.matched[0].sources[0]).toMatchObject({ name: "movistar", kind: "venue" });
  });

  it("mapea River Plate y Más Monumental desde el archivo real", () => {
    const aliases = JSON.parse(
      readFileSync(path.join(process.cwd(), "content", "venue-aliases.json"), "utf8"),
    ) as Record<string, string[]>;
    const real: NormalizeContext = { ...ctx, aliases };
    const names = ["River Plate", "Mas Monumental", "Más Monumental"];
    for (const venueName of names) {
      const result = normalize([raw({ venueName })], real);
      expect(result.matched[0]?.venueSlug).toBe("estadio-monumental");
      expect(result.unmatched).toEqual([]);
    }
  });

  it("deja en unmatched un venue que no mapea", () => {
    const result = normalize([raw({ venueName: "Club Inventado", city: "Rosario" })], ctx);
    expect(result.matched).toEqual([]);
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0].reason).toContain("no está en venue-aliases.json");
    expect(result.unmatched[0].city).toBe("Rosario");
  });

  it("interpreta la hora en Argentina y no corre un día las fechas sin hora", () => {
    expect(scheduleParts("2026-12-10T21:00:00Z")).toEqual({ date: "2026-12-10", showTime: "18:00" });
    expect(scheduleParts("2026-12-10")).toEqual({ date: "2026-12-10", showTime: null });
    expect(scheduleParts("no-es-fecha")).toBeNull();
  });
});
