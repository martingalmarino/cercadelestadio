import type { EventCategory } from "../../../src/lib/types";
import type { FetchContext, RawEvent } from "../types";

type RobotGroup = {
  agents: string[];
  allow: string[];
  disallow: string[];
};

export type RobotRules = {
  allow: string[];
  disallow: string[];
};

export type SitemapEntry = {
  loc: string;
  lastmod: string;
};

const eventType = /Event$/;

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function decodeHtml(value: string) {
  return decodeXml(value).replaceAll("&#39;", "'");
}

export function parseSitemap(xml: string) {
  const indexes: SitemapEntry[] = [];
  const urls: SitemapEntry[] = [];
  const blocks = xml.matchAll(/<(?:[\w-]+:)?(sitemap|url)\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?\1>/gi);
  for (const block of blocks) {
    const body = block[2];
    const loc = body.match(/<(?:[\w-]+:)?loc>\s*([^<]+?)\s*<\/(?:[\w-]+:)?loc>/i)?.[1];
    if (!loc) continue;
    const lastmod =
      body.match(/<(?:[\w-]+:)?lastmod>\s*([^<]+?)\s*<\/(?:[\w-]+:)?lastmod>/i)?.[1]?.trim() ?? "";
    const entry = { loc: decodeXml(loc.trim()), lastmod };
    if (block[1].toLowerCase() === "sitemap") indexes.push(entry);
    else urls.push(entry);
  }
  return { indexes, urls };
}

export function parseRobots(text: string) {
  const groups: RobotGroup[] = [];
  let current: RobotGroup | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const index = line.indexOf(":");
    if (index < 1) continue;
    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    if (key === "user-agent") {
      if (!current || current.allow.length > 0 || current.disallow.length > 0) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      continue;
    }
    if (!current) continue;
    if (key === "allow" && value) current.allow.push(value);
    if (key === "disallow" && value) current.disallow.push(value);
  }
  return groups;
}

export function rulesFor(text: string, agent: string): RobotRules {
  const groups = parseRobots(text);
  const token = agent.toLowerCase();
  const specific = groups.filter((group) =>
    group.agents.some((name) => name !== "*" && token.includes(name)),
  );
  const chosen = specific.length > 0 ? specific : groups.filter((group) => group.agents.includes("*"));
  return {
    allow: chosen.flatMap((group) => group.allow),
    disallow: chosen.flatMap((group) => group.disallow),
  };
}

function ruleMatches(pattern: string, path: string) {
  let source = "^";
  for (const char of pattern) {
    if (char === "*") source += ".*";
    else if (char === "$") source += "$";
    else source += /[.+?^{}()|[\]\\]/.test(char) ? `\\${char}` : char;
  }
  return new RegExp(source).test(path);
}

export function pathAllowed(path: string, rules: RobotRules) {
  let length = -1;
  let allow = true;
  const consider = (pattern: string, permits: boolean) => {
    if (!ruleMatches(pattern, path)) return;
    if (pattern.length > length || (pattern.length === length && permits)) {
      length = pattern.length;
      allow = permits;
    }
  };
  for (const pattern of rules.disallow) consider(pattern, false);
  for (const pattern of rules.allow) consider(pattern, true);
  return length < 0 ? true : allow;
}

export function shouldFetch(lastmod: string, previous: string | null) {
  if (previous === null) return true;
  return previous !== lastmod;
}

function typesOf(value: unknown) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function isEvent(type: string) {
  return type === "Festival" || eventType.test(type);
}

function categoryOf(types: string[]): EventCategory {
  if (types.includes("SportsEvent")) return "partido";
  if (types.includes("Festival")) return "festival";
  return "recital";
}

function textOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = textOf(item);
      if (text) return text;
    }
    return "";
  }
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return textOf(record.name) || textOf(record.address);
}

function collectNodes(node: unknown, found: Record<string, unknown>[]) {
  if (Array.isArray(node)) {
    for (const item of node) collectNodes(item, found);
    return;
  }
  if (!node || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  const types = typesOf(record["@type"]);
  if (types.some(isEvent)) found.push(record);
  if (record["@graph"]) collectNodes(record["@graph"], found);
  if (types.includes("ItemList")) collectNodes(record.itemListElement, found);
}

function jsonScripts(html: string) {
  const blocks: string[] = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const body = match[1].trim();
    if (body) blocks.push(body);
  }
  return blocks;
}

function parseJson(body: string) {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return JSON.parse(decodeHtml(body)) as unknown;
  }
}

function metaContent(html: string, key: string) {
  const pattern = new RegExp(
    `<meta\\b[^>]*(?:property|name|itemprop)=["']${key}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta\\b[^>]*content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${key}["'][^>]*>`,
    "i",
  );
  const match = html.match(pattern);
  const value = match?.[1] ?? match?.[2];
  return value ? decodeHtml(value).trim() : "";
}

export function eventsFromHtml(html: string, pageUrl: string, source: string): RawEvent[] {
  const nodes: Record<string, unknown>[] = [];
  for (const body of jsonScripts(html)) {
    try {
      collectNodes(parseJson(body), nodes);
    } catch {
      continue;
    }
  }
  const raw: RawEvent[] = [];
  const seen = new Set<string>();
  nodes.forEach((node, index) => {
    const name = textOf(node.name);
    const start = textOf(node.startDate);
    if (!name || !start) return;
    const id = textOf(node["@id"]) || textOf(node.url) || `${pageUrl}#${index}`;
    if (seen.has(id)) return;
    seen.add(id);
    const venue = textOf(node.location);
    raw.push({
      source,
      url: textOf(node.url) || pageUrl,
      artistOrTitle: name,
      venueName: venue,
      startsAt: start,
      category: categoryOf(typesOf(node["@type"])),
      externalId: id,
    });
  });
  if (raw.length > 0) return raw;

  const name = metaContent(html, "og:title") || html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || "";
  const start =
    metaContent(html, "event:start_time") ||
    metaContent(html, "startDate") ||
    metaContent(html, "og:start_time");
  if (!name || !start) return [];
  const venue = metaContent(html, "event:location") || metaContent(html, "og:location") || metaContent(html, "location");
  return [
    {
      source,
      url: pageUrl,
      artistOrTitle: decodeHtml(name),
      venueName: venue,
      startsAt: start,
      category: "recital",
      externalId: pageUrl,
    },
  ];
}

export async function collectSitemapEvents(
  ctx: FetchContext,
  options: { source: string; sitemapUrl: string; robotsUrl: string; userAgent: string },
): Promise<RawEvent[]> {
  const robots = rulesFor(await ctx.fetchText(options.robotsUrl), options.userAgent);
  const pending = [options.sitemapUrl];
  const visited = new Set<string>();
  const pages: SitemapEntry[] = [];

  while (pending.length > 0) {
    const sitemapUrl = pending.shift();
    if (!sitemapUrl || visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);
    const parsed = parseSitemap(await ctx.fetchText(sitemapUrl));
    for (const child of parsed.indexes) pending.push(child.loc);
    pages.push(...parsed.urls);
  }

  const events: RawEvent[] = [];
  for (const page of pages) {
    let url: URL;
    try {
      url = new URL(page.loc);
    } catch {
      continue;
    }
    if (!pathAllowed(url.pathname, robots)) continue;
    const previous = ctx.seenUrl?.(options.source, page.loc) ?? null;
    if (!shouldFetch(page.lastmod, previous)) continue;
    let html: string;
    try {
      html = await ctx.fetchText(page.loc);
    } catch (error) {
      const message = error instanceof Error ? error.message : "error desconocido";
      console.error(`${options.source} ${page.loc}: ${message}`);
      continue;
    }
    ctx.rememberUrl?.(options.source, page.loc, page.lastmod);
    events.push(...eventsFromHtml(html, page.loc, options.source));
  }
  return events;
}
