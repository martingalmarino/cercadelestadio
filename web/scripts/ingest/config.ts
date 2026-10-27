import { movistarArena } from "./sources/movistar-arena";
import { theSportsDb } from "./sources/thesportsdb";
import { ticketekSitemap } from "./sources/ticketek-sitemap";
import { tuentradaSitemap } from "./sources/tuentrada-sitemap";
import type { PressFeed } from "./sources/signals-rss";
import type { IngestSource, SourceKind } from "./types";

// Solo alertas en el reporte. No crea eventos.
export const pressFeeds: PressFeed[] = [
  { name: "Indie Hoy", url: "https://indiehoy.com/feed/" },
  { name: "Clarín Espectáculos", url: "https://www.clarin.com/rss/espectaculos/" },
  {
    name: "La Nación Espectáculos",
    url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/category/espectaculos/?outputType=xml",
  },
];

export const sources: IngestSource[] = [
  movistarArena,
  theSportsDb,
  ticketekSitemap, // revisar ToS antes de activar
  tuentradaSitemap, // revisar ToS antes de activar
];

export function enabledSources() {
  return sources.filter((source) => source.enabled);
}

export function sourceKind(name: string): SourceKind {
  return sources.find((source) => source.name === name)?.kind ?? "senal";
}
