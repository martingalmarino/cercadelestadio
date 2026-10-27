import { isFinished } from "../../src/lib/events";
import { baDate } from "../../src/lib/format";
import type { EventStatus, ShowEvent } from "../../src/lib/types";
import { dedupeKey, sameArtist } from "./dedupe";
import { typeFor } from "./normalize";
import { slugify } from "./text";
import type { IngestState, NormalizedEvent, SourceRef } from "./types";

export type MergeInput = {
  existing: ShowEvent[];
  incoming: NormalizedEvent[];
  state: IngestState;
  ranSources: string[];
  now: Date;
};

export type MergeNote = {
  slug: string;
  artist: string;
  detail: string;
};

export type MergeResult = {
  events: ShowEvent[];
  state: IngestState;
  nuevos: MergeNote[];
  cambiados: MergeNote[];
  revisar: MergeNote[];
};

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function statusFromSources(sources: SourceRef[]): EventStatus {
  if (sources.some((source) => source.kind === "ticketera" || source.kind === "venue" || source.kind === "fixture")) {
    return "confirmed";
  }
  return "announced";
}

function missKey(source: string, slug: string) {
  return `${source}::${slug}`;
}

function findExisting(existing: ShowEvent[], event: NormalizedEvent, used: Set<string>) {
  const free = (item: ShowEvent) => !used.has(item.slug);
  for (const source of event.sources) {
    const byId = existing.find(
      (item) => free(item) && item.externalIds?.[source.name] === source.externalId,
    );
    if (byId) return byId;
  }
  const key = dedupeKey(event.artist, event.venueSlug, event.date);
  const exact = existing.find(
    (item) => free(item) && item.venueSlug != null && dedupeKey(item.artist, item.venueSlug, item.date) === key,
  );
  if (exact) return exact;
  return (
    existing.find(
      (item) =>
        free(item) &&
        item.venueSlug === event.venueSlug &&
        item.date === event.date &&
        sameArtist(item.artist, event.artist),
    ) ?? null
  );
}

function applySources(event: ShowEvent, sources: SourceRef[], seenOn: string) {
  const added: string[] = [];
  const next = event.sources ? [...event.sources] : [];
  const ids = { ...event.externalIds };
  for (const source of sources) {
    const index = next.findIndex((item) => item.name === source.name);
    if (index === -1) {
      next.push({
        name: source.name,
        url: source.url,
        firstSeen: seenOn,
        lastSeen: seenOn,
      });
      added.push(source.name);
    } else {
      const current = next[index];
      next[index] = {
        name: current.name,
        url: source.url || current.url,
        firstSeen: current.firstSeen,
        lastSeen: seenOn,
      };
    }
    if (source.externalId) ids[source.name] = source.externalId;
  }
  event.sources = next;
  event.externalIds = ids;
  return added;
}

function eventSlug(
  artist: string,
  venueSlug: string | null,
  citySlug: string,
  date: string,
  taken: Set<string>,
) {
  const base = `${slugify(artist)}-${venueSlug ?? citySlug}`;
  if (!taken.has(base)) return base;
  const withDate = `${base}-${date}`;
  if (!taken.has(withDate)) return withDate;
  let index = 2;
  while (taken.has(`${withDate}-${index}`)) index += 1;
  return `${withDate}-${index}`;
}

function createEvent(event: NormalizedEvent, taken: Set<string>, seenOn: string, nowMs: number): ShowEvent {
  const slug = eventSlug(event.artist, event.venueSlug, event.citySlug, event.date, taken);
  taken.add(slug);
  const status: EventStatus = isFinished(event.date, nowMs)
    ? "past"
    : statusFromSources(event.sources);
  const created: ShowEvent = {
    slug,
    artist: event.artist,
    venueSlug: event.venueSlug,
    citySlug: event.citySlug,
    date: event.date,
    dateExact: true,
    doors: null,
    showTime: event.showTime,
    type: typeFor(event.category),
    category: event.category,
    status,
    updatedAt: seenOn,
  };
  applySources(created, event.sources, seenOn);
  return created;
}

export function merge(input: MergeInput): MergeResult {
  const seenOn = baDate(input.now.getTime());
  const nowMs = input.now.getTime();
  const taken = new Set(input.existing.map((event) => event.slug));
  const used = new Set<string>();
  const seen = new Map<string, Set<string>>();
  const nuevos: MergeNote[] = [];
  const cambiados: MergeNote[] = [];
  const events = input.existing.map((event) => event);

  for (const incoming of input.incoming) {
    const current = findExisting(events, incoming, used);
    if (!current) {
      const created = createEvent(incoming, taken, seenOn, nowMs);
      events.push(created);
      used.add(created.slug);
      nuevos.push({
        slug: created.slug,
        artist: created.artist,
        detail: `${created.date} · ${created.status}`,
      });
      for (const source of incoming.sources) {
        const slugs = seen.get(source.name) ?? new Set<string>();
        slugs.add(created.slug);
        seen.set(source.name, slugs);
      }
      continue;
    }

    used.add(current.slug);
    const index = events.indexOf(current);
    const next = structuredClone(current);
    const details: string[] = [];
    if (next.date !== incoming.date) {
      details.push(`fecha ${next.date} → ${incoming.date}`);
      next.date = incoming.date;
      next.dateExact = true;
    }
    if (next.venueSlug !== incoming.venueSlug) {
      details.push(`venue ${next.venueSlug ?? "sin venue"} → ${incoming.venueSlug}`);
      next.venueSlug = incoming.venueSlug;
      next.citySlug = incoming.citySlug;
    }
    if (!hasText(next.showTime) && hasText(incoming.showTime)) {
      details.push(`showTime → ${incoming.showTime}`);
      next.showTime = incoming.showTime;
    }
    const added = applySources(next, incoming.sources, seenOn);
    if (added.length > 0) details.push(`sumó fuente ${added.join(", ")}`);
    if (isFinished(next.date, nowMs) && next.status !== "cancelled" && next.status !== "past") {
      details.push("pasó a past");
      next.status = "past";
    } else if (next.status === "announced" && statusFromSources(incoming.sources) === "confirmed") {
      details.push("pasó a confirmed");
      next.status = "confirmed";
    }
    if (details.length > 0) {
      next.updatedAt = seenOn;
      cambiados.push({ slug: next.slug, artist: next.artist, detail: details.join("; ") });
      events[index] = next;
    } else if (JSON.stringify(next.sources) !== JSON.stringify(current.sources) || JSON.stringify(next.externalIds) !== JSON.stringify(current.externalIds)) {
      events[index] = next;
    }
    for (const source of incoming.sources) {
      const slugs = seen.get(source.name) ?? new Set<string>();
      slugs.add(next.slug);
      seen.set(source.name, slugs);
    }
  }

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!isFinished(event.date, nowMs) || event.status === "cancelled" || event.status === "past") {
      continue;
    }
    const next = structuredClone(event);
    next.status = "past";
    next.updatedAt = seenOn;
    events[index] = next;
    cambiados.push({ slug: next.slug, artist: next.artist, detail: "pasó a past" });
  }

  const misses = { ...input.state.misses };
  const revisar: MergeNote[] = [];
  for (const sourceName of input.ranSources) {
    const saw = seen.get(sourceName) ?? new Set<string>();
    for (const event of events) {
      if (!event.sources?.some((source) => source.name === sourceName)) continue;
      const key = missKey(sourceName, event.slug);
      if (saw.has(event.slug)) {
        delete misses[key];
        continue;
      }
      const count = (misses[key] ?? 0) + 1;
      misses[key] = count;
      if (count >= 2) {
        revisar.push({
          slug: event.slug,
          artist: event.artist,
          detail: `falta en ${sourceName} desde hace ${count} corridas`,
        });
      }
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.artist.localeCompare(b.artist));

  return {
    events,
    state: { misses },
    nuevos,
    cambiados,
    revisar,
  };
}
