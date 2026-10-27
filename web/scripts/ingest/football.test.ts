import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isImportantMatch } from "./football";
import { sportsEvents } from "./sources/thesportsdb";

const aliases = JSON.parse(
  readFileSync(path.join(process.cwd(), "content", "venue-aliases.json"), "utf8"),
) as Record<string, string[]>;

describe("partidos importantes", () => {
  it("reconoce clásicos y descarta el resto", () => {
    expect(isImportantMatch("Boca Juniors", "River Plate")).toBe(true);
    expect(isImportantMatch("Racing Club", "CA Independiente")).toBe(true);
    expect(isImportantMatch("Rosario Central", "Newell's Old Boys")).toBe(true);
    expect(isImportantMatch("San Lorenzo", "Huracán")).toBe(true);
    expect(isImportantMatch("Estudiantes de Río Cuarto", "Gimnasia y Esgrima de La Plata")).toBe(false);
    expect(isImportantMatch("Independiente Rivadavia", "River Plate")).toBe(false);
  });

  it("se queda con un clásico solo si el estadio está en los alias", () => {
    const kept = sportsEvents(
      {
        events: [
          {
            idEvent: "1",
            strHomeTeam: "River Plate",
            strAwayTeam: "Boca Juniors",
            strVenue: "Estadio Monumental",
            dateEventLocal: "2026-11-15",
            strTimeLocal: "17:00:00",
          },
          {
            idEvent: "2",
            strHomeTeam: "River Plate",
            strAwayTeam: "Boca Juniors",
            strVenue: "Estadio Antonio Candini",
            dateEventLocal: "2026-11-15",
            strTimeLocal: "17:00:00",
          },
          {
            idEvent: "3",
            strHomeTeam: "Estudiantes de Río Cuarto",
            strAwayTeam: "Gimnasia y Esgrima de La Plata",
            strVenue: "Estadio Mario Alberto Kempes",
            dateEventLocal: "2026-11-15",
            strTimeLocal: "19:00:00",
          },
        ],
      },
      aliases,
    );
    expect(kept).toHaveLength(1);
    expect(kept[0]).toMatchObject({
      artistOrTitle: "River Plate vs Boca Juniors",
      category: "partido",
      startsAt: "2026-11-15T17:00:00-03:00",
      externalId: "1",
      venueName: "Estadio Monumental",
    });
  });
});
