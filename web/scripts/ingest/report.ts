import type { MergeNote } from "./merge";
import type { SignalHit } from "./sources/signals-rss";
import type { SourceRun, UnmatchedEvent } from "./types";

export type ReportInput = {
  now: Date;
  nuevos: MergeNote[];
  cambiados: MergeNote[];
  revisar: MergeNote[];
  unmatched: UnmatchedEvent[];
  fuentes: SourceRun[];
  anuncios?: SignalHit[];
  avisos?: { feed: string; error: string }[];
};

function lines(items: string[]) {
  if (items.length === 0) return "Ninguno.\n";
  return `${items.map((item) => `- ${item}`).join("\n")}\n`;
}

function note(item: MergeNote) {
  return `${item.artist} (${item.slug}): ${item.detail}`;
}

export function renderReport(input: ReportInput) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(input.now);

  const fuentes =
    input.fuentes.length === 0
      ? "Ninguna fuente habilitada.\n"
      : `${input.fuentes
          .map((source) => {
            if (source.ok) return `- ${source.name}: ${source.count ?? 0} eventos`;
            return `- ${source.name}: error. ${source.error ?? "falló"}`;
          })
          .join("\n")}\n`;

  const sinVenue = input.unmatched.map(
    (item) =>
      `${item.artist || "Sin artista"} — ${item.venueName || "sin venue"} — ${item.reason} — ${item.source} — ${item.url}`,
  );
  const anuncios = [
    ...(input.anuncios ?? []).map(
      (item) => `${item.venue} — ${item.title} — ${item.url} — ${item.feed}`,
    ),
    ...(input.avisos ?? []).map((item) => `${item.feed}: error. ${item.error}`),
  ];

  return `# Ingesta ${date}

## Fuentes

${fuentes}
## Nuevos

${lines(input.nuevos.map(note))}
## Cambiados

${lines(input.cambiados.map(note))}
## A revisar

${lines(input.revisar.map(note))}
## Sin venue

${lines(sinVenue)}
## Posibles anuncios

${lines(anuncios)}`;
}
