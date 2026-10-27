import { fold, includesPhrase } from "../text";
import type { FetchContext } from "../types";

export type PressFeed = {
  name: string;
  url: string;
};

export type PressItem = {
  title: string;
  url: string;
  summary: string;
};

export type SignalHit = {
  feed: string;
  title: string;
  url: string;
  venue: string;
};

export type PressSignalResult = {
  hits: SignalHit[];
  errors: { feed: string; error: string }[];
};

const signalWord = /\b(?:confirmo\w*|llega\w*|shows?)\b/;

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'");
}

function plain(value: string) {
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  const text = cdata ? cdata[1] : value;
  return decodeXml(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function blockText(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? plain(match[1].trim()) : "";
}

export function parseFeed(xml: string): PressItem[] {
  const items: PressItem[] = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const title = blockText(match[1], "title");
    const url = blockText(match[1], "link");
    if (!title || !url) continue;
    items.push({ title, url, summary: blockText(match[1], "description") });
  }
  return items;
}

export function findSignals(items: PressItem[], aliases: Record<string, string[]>, feed: string) {
  const phrases = Object.entries(aliases).flatMap(([venue, names]) =>
    names
      .map((name) => ({ venue, phrase: fold(name) }))
      .filter((item) => item.phrase.length >= 4),
  );
  phrases.sort((a, b) => b.phrase.length - a.phrase.length || a.venue.localeCompare(b.venue));

  const hits: SignalHit[] = [];
  for (const item of items) {
    const text = fold(`${item.title} ${item.summary}`);
    if (!signalWord.test(text)) continue;
    const seen = new Set<string>();
    for (const candidate of phrases) {
      if (seen.has(candidate.venue) || !includesPhrase(text, candidate.phrase)) continue;
      seen.add(candidate.venue);
      hits.push({ feed, title: item.title, url: item.url, venue: candidate.venue });
    }
  }
  return hits;
}

export async function pressSignals(
  ctx: FetchContext,
  feeds: PressFeed[],
  aliases: Record<string, string[]>,
): Promise<PressSignalResult> {
  const hits: SignalHit[] = [];
  const errors: PressSignalResult["errors"] = [];
  for (const feed of feeds) {
    try {
      const xml = await ctx.fetchText(feed.url);
      hits.push(...findSignals(parseFeed(xml), aliases, feed.name));
    } catch (error) {
      const message = error instanceof Error ? error.message : "error desconocido";
      errors.push({ feed: feed.name, error: message });
    }
  }
  return { hits, errors };
}
