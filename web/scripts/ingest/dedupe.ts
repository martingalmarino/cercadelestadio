import { fold, normalizedLevenshtein, slugify } from "./text";
import type { NormalizedEvent, SourceRef } from "./types";

const FUZZY_LIMIT = 0.2;

export function dedupeKey(artist: string, venueSlug: string, date: string) {
  return `${slugify(artist)}|${venueSlug}|${date}`;
}

export function sameArtist(left: string, right: string) {
  const a = fold(left);
  const b = fold(right);
  if (!a || !b) return false;
  if (a === b) return true;
  return normalizedLevenshtein(a, b) < FUZZY_LIMIT;
}

function preferArtist(current: string, candidate: string) {
  return candidate.trim().length > current.trim().length ? candidate : current;
}

function mergeSources(groups: SourceRef[][]) {
  const byName = new Map<string, SourceRef>();
  for (const sources of groups) {
    for (const source of sources) {
      byName.set(source.name, source);
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function collapse(group: NormalizedEvent[]): NormalizedEvent {
  return group.reduce((acc, event) => ({
    artist: preferArtist(acc.artist, event.artist),
    venueSlug: acc.venueSlug,
    citySlug: acc.citySlug,
    date: acc.date,
    showTime: acc.showTime ?? event.showTime,
    category: acc.category,
    sources: mergeSources([acc.sources, event.sources]),
  }));
}

export function dedupe(events: NormalizedEvent[]) {
  const buckets = new Map<string, NormalizedEvent[]>();
  for (const event of events) {
    const bucket = `${event.venueSlug}|${event.date}`;
    const list = buckets.get(bucket) ?? [];
    list.push(event);
    buckets.set(bucket, list);
  }

  const collapsed: NormalizedEvent[] = [];
  for (const group of buckets.values()) {
    const clusters: NormalizedEvent[][] = [];
    for (const event of group) {
      const cluster = clusters.find((items) => items.some((item) => sameArtist(item.artist, event.artist)));
      if (cluster) cluster.push(event);
      else clusters.push([event]);
    }
    for (const cluster of clusters) collapsed.push(collapse(cluster));
  }

  return collapsed.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.artist.localeCompare(b.artist) ||
      a.venueSlug.localeCompare(b.venueSlug),
  );
}
