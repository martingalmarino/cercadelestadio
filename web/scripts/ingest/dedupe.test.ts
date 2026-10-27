import { describe, expect, it } from "vitest";
import { dedupe, dedupeKey, sameArtist } from "./dedupe";
import type { NormalizedEvent } from "./types";

function event(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
  return {
    artist: "Foo Fighters",
    venueSlug: "estadio-monumental",
    citySlug: "buenos-aires",
    date: "2027-02-25",
    showTime: "21:00",
    category: "recital",
    sources: [
      {
        name: "movistar",
        url: "https://example.com/a",
        externalId: "a",
        kind: "venue",
      },
    ],
    ...overrides,
  };
}

describe("dedupe", () => {
  it("arma la clave con artista, venue y fecha", () => {
    expect(dedupeKey("Maná", "estadio-monumental", "2026-12-10")).toBe(
      "mana|estadio-monumental|2026-12-10",
    );
  });

  it("une la misma clave y un artista parecido en el mismo estadio y fecha", () => {
    const result = dedupe([
      event(),
      event({
        artist: "Foo Fighter",
        showTime: null,
        sources: [
          {
            name: "prensa",
            url: "https://example.com/b",
            externalId: "b",
            kind: "senal",
          },
        ],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].artist).toBe("Foo Fighters");
    expect(result[0].sources.map((source) => source.name)).toEqual(["movistar", "prensa"]);
    expect(sameArtist("Foo Fighters", "Foo Fighter")).toBe(true);
  });

  it("no une artistas distintos ni la misma banda en otra fecha", () => {
    expect(sameArtist("Karol G", "Karol")).toBe(false);
    const result = dedupe([
      event({ artist: "Karol G", date: "2027-02-05" }),
      event({ artist: "Karol", date: "2027-02-05" }),
      event({ artist: "Foo Fighters", date: "2027-03-01" }),
    ]);
    expect(result).toHaveLength(3);
  });
});
