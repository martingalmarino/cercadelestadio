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
  url: string;
  funciones: { startsAt: string }[];
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

export function parseFunciones(text: string, today: string) {
  const monthPattern = Object.keys(months).join("|");
  const sep = String.raw`(?:\s*/\s*|\s+)`;
  const pattern = new RegExp(
    `(\\d{1,2})${sep}(?:de\\s+)?(${monthPattern})(?:${sep}(?:de\\s+)?(\\d{4}))?${sep}HORARIOS`,
    "gi",
  );
  const marks = [...text.matchAll(pattern)];
  const found: { date: string; time: string | null }[] = [];
  for (let index = 0; index < marks.length; index += 1) {
    const mark = marks[index];
    const day = Number(mark[1]);
    const month = months[mark[2].toLowerCase()];
    if (!month || day < 1 || day > 31 || mark.index == null) continue;
    const date = resolveYear(day, month, mark[3] ? Number(mark[3]) : null, today);
    const start = mark.index + mark[0].length;
    const end = index + 1 < marks.length ? (marks[index + 1].index ?? text.length) : text.length;
    const times = [...text.slice(start, end).matchAll(/([01]?\d|2[0-3]):([0-5]\d)\s*hs\s+Show/gi)].map(
      (item) => `${item[1].padStart(2, "0")}:${item[2]}`,
    );
    if (times.length === 0) found.push({ date, time: null });
    else for (const time of times) found.push({ date, time });
  }
  const unique = new Map<string, { date: string; time: string | null }>();
  for (const item of found) unique.set(`${item.date}T${item.time ?? ""}`, item);
  return [...unique.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""),
  );
}

export function funcionExternalId(uuid: string, startsAt: string, funciones: { startsAt: string }[]) {
  const date = startsAt.slice(0, 10);
  const time = startsAt.includes("T") ? startsAt.slice(11, 16) : null;
  const sameDay = funciones.filter((item) => item.startsAt.slice(0, 10) === date);
  if (sameDay.length > 1 && time) return `${uuid}#${date}T${time}`;
  return `${uuid}#${date}`;
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

function fallbackFuncion(date: string | null, text: string) {
  if (!date) return [];
  return [{ startsAt: startsAt(date, parseClockTime(text)) }];
}

async function readCache(uuid: string): Promise<CachedShow | null> {
  try {
    const parsed = JSON.parse(await readFile(path.join(cacheDir, `${uuid}.json`), "utf8")) as Partial<CachedShow>;
    if (!parsed.artist || !parsed.url || !Array.isArray(parsed.funciones)) return null;
    const funciones = parsed.funciones.filter(
      (item) => !!item && typeof item.startsAt === "string" && item.startsAt.length >= 10,
    );
    if (funciones.length === 0) return null;
    return { artist: parsed.artist, url: parsed.url, funciones };
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
            const parsed = parseFunciones(text, today);
            const funciones =
              parsed.length > 0
                ? parsed.map((item) => ({ startsAt: startsAt(item.date, item.time) }))
                : fallbackFuncion(card?.date || parseSpanishDate(text, today), text);
            if (!name || funciones.length === 0) {
              console.error(`Movistar Arena ${show.uuid}: sin artista o sin fecha.`);
              continue;
            }
            const record: CachedShow = {
              artist: name,
              url: show.url,
              funciones,
            };
            await writeCache(show.uuid, record);
            cached.set(show.uuid, record);
            console.log(
              `Movistar Arena ${cached.size}/${shows.length}: ${name} ${funciones.map((item) => item.startsAt.slice(0, 10)).join(", ")}`,
            );
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
      for (const funcion of record.funciones) {
        events.push({
          source: "movistar-arena",
          url: record.url,
          artistOrTitle: record.artist,
          venueName: VENUE,
          city: "Buenos Aires",
          startsAt: funcion.startsAt,
          category: "recital",
          externalId: funcionExternalId(show.uuid, funcion.startsAt, record.funciones),
        });
      }
    }
    return events;
  },
};
