import { describe, expect, it } from "vitest";
import { renderReport } from "./report";
import { findSignals, parseFeed, pressSignals } from "./sources/signals-rss";

const aliases = {
  "movistar-arena": ["Movistar Arena", "Movistar"],
  "quality-arena": ["Quality Arena"],
};

const feed = `<?xml version="1.0"?>
<rss><channel>
  <title>Prensa</title>
  <item>
    <title><![CDATA[Quality Arena confirmó el show]]></title>
    <link>https://prensa.example/quality</link>
    <description><![CDATA[<p>La banda llega en noviembre.</p>]]></description>
  </item>
  <item>
    <title>Un show de televisión</title>
    <link>https://prensa.example/tv</link>
    <description>Sin estadio.</description>
  </item>
  <item>
    <title>Movistar Arena publica la grilla</title>
    <link>https://prensa.example/grilla</link>
    <description>Todavía no hay fecha.</description>
  </item>
</channel></rss>`;

describe("señales de prensa", () => {
  it("avisa solo si hay un venue y una palabra de anuncio", () => {
    const hits = findSignals(parseFeed(feed), aliases, "Indie Hoy");
    expect(hits).toEqual([
      {
        feed: "Indie Hoy",
        title: "Quality Arena confirmó el show",
        url: "https://prensa.example/quality",
        venue: "quality-arena",
      },
    ]);
  });

  it("no crea eventos si un feed falla", async () => {
    const result = await pressSignals(
      {
        now: new Date("2026-10-27T15:00:00Z"),
        async fetchText() {
          throw new Error("HTTP 500");
        },
      },
      [{ name: "Indie Hoy", url: "https://indiehoy.com/feed/" }],
      aliases,
    );
    expect(result.hits).toEqual([]);
    expect(result.errors).toEqual([{ feed: "Indie Hoy", error: "HTTP 500" }]);
    const report = renderReport({
      now: new Date("2026-10-27T15:00:00Z"),
      nuevos: [],
      nuevasFunciones: [],
      reprogramados: [],
      cambiados: [],
      revisar: [],
      unmatched: [],
      fuentes: [],
      anuncios: result.hits,
      avisos: result.errors,
    });
    expect(report).toContain("## Posibles anuncios");
    expect(report).toContain("Indie Hoy: error. HTTP 500");
    expect(report).toContain("## Nuevas funciones");
    expect(report).toContain("## Reprogramados");
    expect(report).not.toContain("slug");
  });

  it("lista nuevas funciones y reprogramados", () => {
    const report = renderReport({
      now: new Date("2026-10-27T15:00:00Z"),
      nuevos: [],
      nuevasFunciones: [
        {
          slug: "andres-calamaro-movistar-arena-2026-11-23",
          artist: "Andres Calamaro",
          detail: "nueva función 2026-11-23 21:00 (otras: 2026-10-30)",
        },
      ],
      reprogramados: [
        {
          slug: "huracan-vs-tigre-tomas-duco",
          artist: "Huracán vs Tigre",
          detail: "reprogramado 2026-10-30 → 2026-11-02",
        },
      ],
      cambiados: [],
      revisar: [],
      unmatched: [],
      fuentes: [],
    });
    expect(report.indexOf("## Nuevas funciones")).toBeGreaterThan(report.indexOf("## Nuevos"));
    expect(report.indexOf("## Reprogramados")).toBeGreaterThan(report.indexOf("## Nuevas funciones"));
    expect(report.indexOf("## Cambiados")).toBeGreaterThan(report.indexOf("## Reprogramados"));
    expect(report).toContain("Andres Calamaro (andres-calamaro-movistar-arena-2026-11-23): nueva función 2026-11-23 21:00 (otras: 2026-10-30)");
    expect(report).toContain("Huracán vs Tigre (huracan-vs-tigre-tomas-duco): reprogramado 2026-10-30 → 2026-11-02");
  });
});
