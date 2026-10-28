import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isImportantMatch } from "./football";
import { matchVenue } from "./normalize";
import { gatherFixtures, readSportsJson, sportsEvents } from "./sources/thesportsdb";

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

  it("guarda cualquier partido cuyo estadio está en los alias", () => {
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
          {
            idEvent: "4",
            strHomeTeam: "Atlético Tucumán",
            strAwayTeam: "Boca Juniors",
            strVenue: "Estadio Monumental Presidente José Fierro",
            dateEventLocal: "2026-11-15",
            strTimeLocal: "21:30:00",
          },
        ],
      },
      aliases,
    );
    expect(kept.map((event) => event.externalId)).toEqual(["1", "3"]);
    expect(kept[0]).toMatchObject({
      artistOrTitle: "River Plate vs Boca Juniors",
      category: "partido",
      startsAt: "2026-11-15T17:00:00-03:00",
      externalId: "1",
      venueName: "Estadio Monumental",
    });
    expect(kept[1]).toMatchObject({
      artistOrTitle: "Estudiantes de Río Cuarto vs Gimnasia y Esgrima de La Plata",
      venueName: "Estadio Mario Alberto Kempes",
    });
  });

  it("no confunde el Monumental de Tucumán con el de River", () => {
    expect(matchVenue("Estadio Monumental Presidente José Fierro", aliases)).toBeNull();
    expect(matchVenue("Estadio Más Monumental", aliases)).toBe("estadio-monumental");
  });

  it("si no hay hora local guarda solo la fecha", () => {
    const kept = sportsEvents(
      {
        events: [
          {
            idEvent: "9",
            strHomeTeam: "Huracán",
            strAwayTeam: "Tigre",
            strVenue: "Estadio Tomás Adolfo Ducó",
            dateEvent: "2026-10-30",
            strTimeLocal: null,
            strTime: "22:15:00",
          },
        ],
      },
      aliases,
    );
    expect(kept).toHaveLength(1);
    expect(kept[0].startsAt).toBe("2026-10-30");
  });

  it("recorre las fechas hasta dos vacías y suma a la Selección", async () => {
    const calls: string[] = [];
    const result = await gatherFixtures({
      today: "2026-10-27",
      pause: async () => {},
      async get(apiPath) {
        calls.push(apiPath);
        if (apiPath.startsWith("lookupleague.php")) {
          return { leagues: [{ strCurrentSeason: "2026" }] };
        }
        if (apiPath.includes("r=1")) {
          return {
            events: [
              { idEvent: "a", dateEvent: "2026-04-12" },
              { idEvent: "b", dateEvent: "2026-10-30" },
              { idEvent: "b", dateEvent: "2026-10-30" },
            ],
          };
        }
        if (apiPath.includes("r=2") || apiPath.includes("r=3")) return { events: null };
        if (apiPath.startsWith("eventsnext.php")) {
          return { events: [{ idEvent: "arg", dateEvent: "2026-11-13" }] };
        }
        throw new Error(`no debería pedir ${apiPath}`);
      },
    });
    expect(calls.map((apiPath) => apiPath.split("?")[0])).toEqual([
      "lookupleague.php",
      "eventsround.php",
      "eventsround.php",
      "eventsround.php",
      "eventsnext.php",
    ]);
    expect(calls[1]).toContain("s=2026");
    expect(calls[1]).toContain("id=4406");
    expect(calls.at(-1)).toContain("id=134509");
    expect(result.read).toBe(3);
    expect(result.upcoming.map((event) => event.idEvent)).toEqual(["b", "arg"]);
  });

  it("espera y reintenta si la clave gratuita responde 429", async () => {
    const waits: number[] = [];
    let calls = 0;
    const payload = await readSportsJson(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error("HTTP 429 en https://www.thesportsdb.com/api/v1/json/123/eventsround.php");
        return JSON.stringify({ events: [{ idEvent: "1" }] });
      },
      "https://www.thesportsdb.com/api/v1/json/123/eventsround.php?id=4406&r=1&s=2026",
      "123",
      async (ms) => {
        waits.push(ms);
      },
    );
    expect(calls).toBe(3);
    expect(waits).toEqual([65_000, 65_000]);
    expect(payload).toEqual({ events: [{ idEvent: "1" }] });
  });
});
