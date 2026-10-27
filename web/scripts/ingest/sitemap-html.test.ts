import { describe, expect, it } from "vitest";
import { ticketekSitemap } from "./sources/ticketek-sitemap";
import {
  collectSitemapEvents,
  eventsFromHtml,
  parseSitemap,
  pathAllowed,
  rulesFor,
  shouldFetch,
} from "./sources/sitemap-html";
import { tuentradaSitemap } from "./sources/tuentrada-sitemap";

const robots = `User-agent: *
Allow: /
Disallow: /websource/

User-agent: GPTBot
Disallow: /
`;

describe("sitemaps de ticketeras", () => {
  it("quedan apagadas hasta revisar los términos", () => {
    expect(ticketekSitemap.enabled).toBe(false);
    expect(tuentradaSitemap.enabled).toBe(false);
  });

  it("lee un índice y el lastmod de cada ficha", () => {
    const xml = `<?xml version="1.0"?>
      <sitemapindex>
        <sitemap><loc>https://www.ticketek.com.ar/sitemap-1.xml</loc></sitemap>
      </sitemapindex>
      <urlset>
        <url><loc>https://www.ticketek.com.ar/la-beriso</loc><lastmod>2026-10-01</lastmod></url>
        <url><loc>https://www.ticketek.com.ar/websource/app.js</loc><lastmod>2026-10-02</lastmod></url>
      </urlset>`;
    const parsed = parseSitemap(xml);
    expect(parsed.indexes.map((item) => item.loc)).toEqual(["https://www.ticketek.com.ar/sitemap-1.xml"]);
    expect(parsed.urls[0]).toEqual({ loc: "https://www.ticketek.com.ar/la-beriso", lastmod: "2026-10-01" });
  });

  it("respeta el bloqueo de /websource/ y deja pasar el resto", () => {
    const rules = rulesFor(robots, "cercadelestadio-bot (+https://www.cercadelestadio.com)");
    expect(pathAllowed("/websource/app.js", rules)).toBe(false);
    expect(pathAllowed("/la-beriso", rules)).toBe(true);
  });

  it("no vuelve a bajar una ficha si el lastmod no cambió", () => {
    expect(shouldFetch("2026-10-01", null)).toBe(true);
    expect(shouldFetch("2026-10-01", "2026-10-01")).toBe(false);
    expect(shouldFetch("2026-10-02", "2026-10-01")).toBe(true);
  });

  it("saca el evento del JSON-LD y, si no hay, de los meta", () => {
    const html = `<script type="application/ld+json">
      {"@graph":[{"@type":"MusicEvent","name":"Jesse & Joy","startDate":"2026-11-01T21:00:00-03:00","location":{"@type":"Place","name":"Quality Arena"}}]}
    </script>`;
    expect(eventsFromHtml(html, "https://tuentrada.com/quality-arena", "tuentrada-sitemap")).toEqual([
      {
        source: "tuentrada-sitemap",
        url: "https://tuentrada.com/quality-arena",
        artistOrTitle: "Jesse & Joy",
        venueName: "Quality Arena",
        startsAt: "2026-11-01T21:00:00-03:00",
        category: "recital",
        externalId: "https://tuentrada.com/quality-arena#0",
      },
    ]);

    const meta = `<title>Ignorado</title>
      <meta property="og:title" content="Babasónicos">
      <meta itemprop="startDate" content="2026-11-20">
      <meta itemprop="location" content="Hipódromo de La Plata">`;
    expect(eventsFromHtml(meta, "https://www.ticketek.com.ar/babasonicos", "ticketek-sitemap")[0]).toMatchObject({
      artistOrTitle: "Babasónicos",
      venueName: "Hipódromo de La Plata",
      startsAt: "2026-11-20",
      category: "recital",
    });
  });

  it("no pide la ficha bloqueada ni la que no cambió", async () => {
    const asked: string[] = [];
    const remembered: string[] = [];
    const events = await collectSitemapEvents(
      {
        now: new Date("2026-10-27T12:00:00Z"),
        seenUrl: (_source, url) => (url.endsWith("/vieja") ? "2026-10-01" : null),
        rememberUrl: (_source, url) => remembered.push(url),
        async fetchText(url) {
          asked.push(url);
          if (url.endsWith("/robots.txt")) return robots;
          if (url.endsWith("/sitemap.xml")) {
            return `<sitemapindex><sitemap><loc>https://www.ticketek.com.ar/sitemap-1.xml</loc></sitemap></sitemapindex>`;
          }
          if (url.endsWith("/sitemap-1.xml")) {
            return `<urlset>
              <url><loc>https://www.ticketek.com.ar/websource/app.js</loc><lastmod>2026-10-02</lastmod></url>
              <url><loc>https://www.ticketek.com.ar/vieja</loc><lastmod>2026-10-01</lastmod></url>
              <url><loc>https://www.ticketek.com.ar/nueva</loc><lastmod>2026-10-03</lastmod></url>
            </urlset>`;
          }
          return `<script type="application/ld+json">{"@type":"MusicEvent","name":"Tan Biónica","startDate":"2026-12-01","location":{"name":"Quality Arena"}}</script>`;
        },
      },
      {
        source: "ticketek-sitemap",
        sitemapUrl: "https://www.ticketek.com.ar/sitemap.xml",
        robotsUrl: "https://www.ticketek.com.ar/robots.txt",
        userAgent: "cercadelestadio-bot",
      },
    );
    expect(asked).not.toContain("https://www.ticketek.com.ar/websource/app.js");
    expect(asked).not.toContain("https://www.ticketek.com.ar/vieja");
    expect(events.map((event) => event.artistOrTitle)).toEqual(["Tan Biónica"]);
    expect(remembered).toEqual(["https://www.ticketek.com.ar/nueva"]);
  });
});
