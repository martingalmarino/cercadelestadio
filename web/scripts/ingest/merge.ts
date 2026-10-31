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
  nuevasFunciones: MergeNote[];
  reprogramados: MergeNote[];
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

function functionId(externalId: string) {
  const hash = externalId.indexOf("#");
  if (hash <= 0) return null;
  const match = /^(\d{4}-\d{2}-\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d)?$/.exec(externalId.slice(hash + 1));
  if (!match) return null;
  return { base: externalId.slice(0, hash), date: match[1] };
}

function baseExternalId(externalId: string) {
  return functionId(externalId)?.base ?? externalId;
}

function sameStoredId(current: string, incoming: string, currentDate: string, incomingDate: string) {
  if (current === incoming) return true;
  const parsed = functionId(incoming);
  return parsed != null && current === parsed.base && parsed.date === incomingDate && currentDate === incomingDate;
}

function idsConflict(item: ShowEvent, event: NormalizedEvent) {
  return event.sources.some((source) => {
    const current = item.externalIds?.[source.name];
    if (!current || !source.externalId) return false;
    return !sameStoredId(current, source.externalId, item.date, event.date);
  });
}

function findExisting(existing: ShowEvent[], event: NormalizedEvent, used: Set<string>) {
  const free = (item: ShowEvent) => !used.has(item.slug);
  for (const source of event.sources) {
    if (!source.externalId) continue;
    const byId = existing.find(
      (item) => free(item) && item.externalIds?.[source.name] === source.externalId,
    );
    if (byId) return { event: byId, exactId: true };
    const parsed = functionId(source.externalId);
    if (parsed && parsed.date === event.date) {
      const legacy = existing.find(
        (item) => free(item) && item.externalIds?.[source.name] === parsed.base && item.date === event.date,
      );
      if (legacy) return { event: legacy, exactId: false };
    }
  }
  const key = dedupeKey(event.artist, event.venueSlug, event.date);
  const exact = existing.find(
    (item) =>
      free(item) &&
      !idsConflict(item, event) &&
      item.venueSlug != null &&
      dedupeKey(item.artist, item.venueSlug, item.date) === key,
  );
  if (exact) return { event: exact, exactId: false };
  const fuzzy = existing.find(
    (item) =>
      free(item) &&
      !idsConflict(item, event) &&
      item.venueSlug === event.venueSlug &&
      item.date === event.date &&
      sameArtist(item.artist, event.artist),
  );
  return fuzzy ? { event: fuzzy, exactId: false } : null;
}

function relatedFunctions(events: ShowEvent[], event: NormalizedEvent) {
  return events.filter((item) => {
    if (item.venueSlug !== event.venueSlug) return false;
    const sameListing = event.sources.some((source) => {
      const current = item.externalIds?.[source.name];
      if (!current || !source.externalId) return false;
      return baseExternalId(current) === baseExternalId(source.externalId);
    });
    return sameListing || sameArtist(item.artist, event.artist);
  });
}

function funcionDetail(event: ShowEvent, others: ShowEvent[]) {
  const when = event.showTime ? `${event.date} ${event.showTime}` : event.date;
  const otras = [...new Set(others.map((item) => item.date))].sort().join(", ");
  return `nueva función ${when} (otras: ${otras})`;
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
  const base = `${slugify(artist)}-${venueSlug ?? citySlug}-${date}`;
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
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
  const nuevasFunciones: MergeNote[] = [];
  const reprogramados: MergeNote[] = [];
  const cambiados: MergeNote[] = [];
  const events = input.existing.map((event) => event);

  for (const incoming of input.incoming) {
    const found = findExisting(events, incoming, used);
    if (!found) {
      const others = relatedFunctions(events, incoming);
      const created = createEvent(incoming, taken, seenOn, nowMs);
      events.push(created);
      used.add(created.slug);
      if (others.length > 0) {
        nuevasFunciones.push({
          slug: created.slug,
          artist: created.artist,
          detail: funcionDetail(created, others),
        });
      } else {
        nuevos.push({
          slug: created.slug,
          artist: created.artist,
          detail: `${created.date} · ${created.status}`,
        });
      }
      for (const source of incoming.sources) {
        const slugs = seen.get(source.name) ?? new Set<string>();
        slugs.add(created.slug);
        seen.set(source.name, slugs);
      }
      continue;
    }

    const current = found.event;
    used.add(current.slug);
    const index = events.indexOf(current);
    const next = structuredClone(current);
    const details: string[] = [];
    const reprogramado =
      found.exactId && next.date !== incoming.date
        ? { from: next.date, to: incoming.date }
        : null;
    if (reprogramado) {
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
    if (reprogramado || details.length > 0) {
      next.updatedAt = seenOn;
      if (reprogramado) {
        reprogramados.push({
          slug: next.slug,
          artist: next.artist,
          detail: `reprogramado ${reprogramado.from} → ${reprogramado.to}`,
        });
      }
      if (details.length > 0) {
        cambiados.push({ slug: next.slug, artist: next.artist, detail: details.join("; ") });
      }
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
      if (event.status === "past" || isFinished(event.date, nowMs)) continue;
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
    nuevasFunciones,
    reprogramados,
    cambiados,
    revisar,
  };
}
