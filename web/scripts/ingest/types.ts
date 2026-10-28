import type { EventCategory } from "../../src/lib/types";

export type SourceKind = "ticketera" | "venue" | "senal" | "fixture";

export type RawEvent = {
  source: string;
  url: string;
  artistOrTitle: string;
  venueName: string;
  city?: string;
  startsAt: string;
  category: EventCategory;
  externalId: string;
};

export type FetchContext = {
  fetchText: (url: string, timeoutMs?: number) => Promise<string>;
  now: Date;
  seenUrl?: (source: string, url: string) => string | null;
  rememberUrl?: (source: string, url: string, lastmod: string) => void;
};

export type IngestSource = {
  name: string;
  kind: SourceKind;
  enabled: boolean;
  fetch: (ctx: FetchContext) => Promise<RawEvent[]>;
};

export type SourceRef = {
  name: string;
  url: string;
  externalId: string;
  kind: SourceKind;
};

export type NormalizedEvent = {
  artist: string;
  venueSlug: string;
  citySlug: string;
  date: string;
  showTime: string | null;
  category: EventCategory;
  sources: SourceRef[];
};

export type UnmatchedEvent = {
  artist: string;
  venueName: string;
  city?: string;
  startsAt: string;
  source: string;
  url: string;
  reason: string;
};

export type IngestState = {
  misses: Record<string, number>;
  sitemaps?: Record<string, string>;
};

export type SourceRun = {
  name: string;
  ok: boolean;
  count?: number;
  detail?: string;
  error?: string;
};
