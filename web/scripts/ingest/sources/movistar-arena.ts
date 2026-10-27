import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { baDate } from "../../../src/lib/format";
import { USER_AGENT, waitForHost } from "../http";
import type { IngestSource, RawEvent } from "../types";

const SITEMAP = "https://www.movistararena.com.ar/sitemap.xml";
const SHOWS = "https://www.movistararena.com.ar/shows";
const HOST = "www.movistararena.com.ar";
const VENUE = "Movistar Arena";
const cacheDir = path.join(process.cwd(), "scripts", "ingest", ".cache", "movistar-arena");

const months: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

type CachedShow = {
  artist: string;
  startsAt: string;
  url: string;
};

type ListingCard = {
  uuid: string;
  artist: string;
  date: string;
};

export function showUrls(xml: string) {
  const found: { uuid: string; url: string }[] = [];
  const pattern = /<loc>\s*(https?:\/\/[^<\s]*\/show\/([0-9a-fA-F-]{36}))\s*<\/loc>/g;
  for (const match of xml.matchAll(pattern)) {
    found.push({ url: match[1], uuid: match[2].toLowerCase() });
  }
  return found;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function resolveYear(day: number, month: number, year: number | null, today: string) {
  if (year) return isoDate(year, month, day);
  const current = Number(today.slice(0, 4));
  let date = isoDate(current, month, day);
  if (date < today) {
    const days = (Date.parse(`${today}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / 86_400_000;
    if (days > 14) date = isoDate(current + 1, month, day);
  }
  return date;
}

export function parseSpanishDate(text: string, today: string) {
  const pattern =
    /(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?/gi;
  const matches = [...text.matchAll(pattern)];
  if (matches.length === 0) return null;
  const chosen = matches.find((match) => match[3]) ?? matches[0];
  const day = Number(chosen[1]);
  const month = months[chosen[2].toLowerCase()];
  if (!month || day < 1 || day > 31) return null;
  return resolveYear(day, month, chosen[3] ? Number(chosen[3]) : null, today);
}

export function parseClockTime(text: string) {
  const labeled = text.match(/([01]?\d|2[0-3]):([0-5]\d)\s*hs\s+Show/i);
  const spoken = text.match(/\ba las\s+([01]?\d|2[0-3]):([0-5]\d)\b/i);
  const match = labeled ?? spoken;
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function junkLine(line: string) {
  return (
    /^\d+$/.test(line) ||
    /^(Días|Horas|Minutos|Segundos|Shows|REINTENTAR)$/i.test(line) ||
    /no pudimos conectar|request is blocked/i.test(line) ||
    /^\d{8}T/.test(line)
  );
}

export function artistFromFicha(text: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const volver = lines.indexOf("Volver");
  if (volver < 0) return null;
  const titles: string[] = [];
  for (const line of lines.slice(volver + 1)) {
    if (line === "Faltan" || line === "Acerca del evento") break;
    if (junkLine(line)) continue;
    titles.push(line);
  }
  if (titles.length === 0) return null;
  return titles[titles.length - 1];
}

function startsAt(date: string, time: string | null) {
  if (!time) return date;
  return `${date}T${time}:00-03:00`;
}

async function readCache(uuid: string): Promise<CachedShow | null> {
  try {
    const parsed = JSON.parse(await readFile(path.join(cacheDir, `${uuid}.json`), "utf8")) as CachedShow;
    if (!parsed.artist || !parsed.startsAt || !parsed.url) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(uuid: string, show: CachedShow) {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(path.join(cacheDir, `${uuid}.json`), `${JSON.stringify(show, null, 2)}\n`);
}

export const movistarArena: IngestSource = {
  name: "movistar-arena",
  kind: "venue",
  enabled: true,
  async fetch(ctx) {
    const today = baDate(ctx.now.getTime());
    const xml = await ctx.fetchText(SITEMAP);
    const shows = showUrls(xml);
    const cached = new Map<string, CachedShow>();
    const pending: { uuid: string; url: string }[] = [];
    for (const show of shows) {
      const hit = await readCache(show.uuid);
      if (hit) cached.set(show.uuid, hit);
      else pending.push(show);
    }

    const listing = new Map<string, ListingCard>();
    if (pending.length > 0) {
      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage({ userAgent: USER_AGENT });
        await page.route("**/*", (route) => {
          const type = route.request().resourceType();
          if (type === "image" || type === "media" || type === "font") return route.abort();
          return route.continue();
        });
        await waitForHost(HOST);
        await page.goto(SHOWS, { waitUntil: "domcontentloaded", timeout: 30_000 });
        await page.waitForFunction(() => document.body.innerText.includes("Más info"), { timeout: 20_000 });
        const cards = await page.evaluate(() => {
          const links = [...document.querySelectorAll('a[href*="/show/"]')].filter((anchor) =>
            anchor.textContent?.includes("Más info"),
          ) as HTMLAnchorElement[];
          const seen = new Set<string>();
          const rows: { href: string; text: string }[] = [];
          for (const anchor of links) {
            if (seen.has(anchor.href)) continue;
            seen.add(anchor.href);
            let node: HTMLElement | null = anchor;
            while (node && !/\d{4}/.test(node.innerText)) node = node.parentElement;
            rows.push({ href: anchor.href, text: (node ?? anchor).innerText.replace(/\s+/g, " ").trim() });
          }
          return rows;
        });
        for (const card of cards) {
          const uuid = card.href.match(/\/show\/([0-9a-fA-F-]{36})/)?.[1]?.toLowerCase();
          if (!uuid) continue;
          const date = parseSpanishDate(card.text, today);
          const artist = card.text.split(/\s+\d{1,2}\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/i)[0]?.trim();
          if (date && artist) listing.set(uuid, { uuid, artist, date });
        }

        for (const show of pending) {
          try {
            const card = listing.get(show.uuid);
            let text = "";
            let artist: string | null = null;
            for (let attempt = 0; attempt < 2 && !artist; attempt += 1) {
              await waitForHost(HOST);
              await page.goto(show.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
              await page
                .waitForFunction(
                  () => /Volver/.test(document.body.innerText) && /Acerca del evento/.test(document.body.innerText),
                  { timeout: 20_000 },
                )
                .catch(() => undefined);
              text = await page.locator("body").innerText();
              if (/request is blocked|no pudimos conectar/i.test(text)) continue;
              artist = artistFromFicha(text);
            }
            const listingArtist = card && !junkLine(card.artist) ? card.artist : "";
            const name = artist || listingArtist;
            const date = card?.date || parseSpanishDate(text, today);
            if (!name || !date) {
              console.error(`Movistar Arena ${show.uuid}: sin artista o sin fecha.`);
              continue;
            }
            const record: CachedShow = {
              artist: name,
              startsAt: startsAt(date, parseClockTime(text)),
              url: show.url,
            };
            await writeCache(show.uuid, record);
            cached.set(show.uuid, record);
            console.log(`Movistar Arena ${cached.size}/${shows.length}: ${name} ${date}`);
          } catch (error) {
            const message = error instanceof Error ? error.message : "error desconocido";
            console.error(`Movistar Arena ${show.uuid}: ${message}`);
          }
        }
      } finally {
        await browser.close();
      }
    }

    const events: RawEvent[] = [];
    for (const show of shows) {
      const record = cached.get(show.uuid);
      if (!record) continue;
      events.push({
        source: "movistar-arena",
        url: record.url,
        artistOrTitle: record.artist,
        venueName: VENUE,
        city: "Buenos Aires",
        startsAt: record.startsAt,
        category: "recital",
        externalId: show.uuid,
      });
    }
    return events;
  },
};
