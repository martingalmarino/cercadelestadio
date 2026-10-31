import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { enabledSources, pressFeeds, sources } from "./config";
import { pressSignals } from "./sources/signals-rss";
import { lastSportsRead } from "./sources/thesportsdb";
import { loadLocalEnv } from "./env";
import { dedupe } from "./dedupe";
import { fetchText } from "./http";
import { merge } from "./merge";
import { loadNormalizeContext, normalize } from "./normalize";
import { renderReport } from "./report";
import type { IngestState, RawEvent, SourceRun } from "./types";

const contentDir = path.join(process.cwd(), "content");

function emptyState(): IngestState {
  return { misses: {} };
}

function readSitemaps(value: unknown) {
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("ingest-state.json: sitemaps tiene que ser un objeto.");
  }
  const sitemaps: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "string") {
      throw new Error(`ingest-state.json: sitemaps de ${key} tiene que ser texto.`);
    }
    sitemaps[key] = item;
  }
  return sitemaps;
}

function seenKey(source: string, url: string) {
  return `${source}\n${url}`;
}

async function readState(file: string): Promise<IngestState> {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as Partial<IngestState>;
    if (!parsed || typeof parsed !== "object" || !parsed.misses || typeof parsed.misses !== "object") {
      throw new Error("ingest-state.json no tiene la forma { misses: {} }.");
    }
    const sitemaps = readSitemaps(parsed.sitemaps);
    return sitemaps ? { misses: parsed.misses, sitemaps } : { misses: parsed.misses };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return emptyState();
    throw error;
  }
}

async function main() {
  loadLocalEnv();
  const now = new Date();
  const eventsFile = path.join(contentDir, "events.json");
  const stateFile = path.join(contentDir, "ingest-state.json");
  const reportFile = path.join(contentDir, "ingest-report.md");
  const ctx = await loadNormalizeContext(contentDir);
  const existing = JSON.parse(await readFile(eventsFile, "utf8"));
  const state = await readState(stateFile);
  const seen = { ...(state.sitemaps ?? {}) };
  const raw: RawEvent[] = [];
  const fuentes: SourceRun[] = [];
  const ranSources: string[] = [];

  for (const source of enabledSources()) {
    try {
      const events = await source.fetch({
        fetchText,
        now,
        seenUrl(name, url) {
          const key = seenKey(name, url);
          return Object.prototype.hasOwnProperty.call(seen, key) ? seen[key] : null;
        },
        rememberUrl(name, url, lastmod) {
          seen[seenKey(name, url)] = lastmod;
        },
      });
      raw.push(...events);
      ranSources.push(source.name);
      const stats = source.name === "thesportsdb" ? lastSportsRead() : null;
      fuentes.push({
        name: source.name,
        ok: true,
        count: events.length,
        detail: stats
          ? `${stats.read} eventos leídos, ${stats.matched} coincidieron con nuestros estadios`
          : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "error desconocido";
      fuentes.push({ name: source.name, ok: false, error: message });
      console.error(`Fuente ${source.name}: ${message}`);
    }
  }

  const press = await pressSignals({ fetchText, now }, pressFeeds, ctx.aliases);
  const kinds = Object.fromEntries(sources.map((source) => [source.name, source.kind]));
  const normalized = normalize(raw, { ...ctx, kinds });
  const result = merge({
    existing,
    incoming: dedupe(normalized.matched),
    state,
    ranSources,
    now,
  });
  const eventsText = `${JSON.stringify(result.events, null, 2)}\n`;
  const previous = await readFile(eventsFile, "utf8");
  if (eventsText !== previous) {
    await writeFile(eventsFile, eventsText);
  }
  const nextState: IngestState = { misses: result.state.misses };
  if (Object.keys(seen).length > 0) nextState.sitemaps = seen;
  await writeFile(stateFile, `${JSON.stringify(nextState, null, 2)}\n`);
  const report = renderReport({
    now,
    nuevos: result.nuevos,
    nuevasFunciones: result.nuevasFunciones,
    reprogramados: result.reprogramados,
    cambiados: result.cambiados,
    revisar: result.revisar,
    unmatched: normalized.unmatched,
    fuentes,
    anuncios: press.hits,
    avisos: press.errors,
  });
  await writeFile(reportFile, report);
  console.log(reportFile);
  console.log(
    `Nuevos: ${result.nuevos.length}. Nuevas funciones: ${result.nuevasFunciones.length}. Reprogramados: ${result.reprogramados.length}. Cambiados: ${result.cambiados.length}. A revisar: ${result.revisar.length}. Sin venue: ${normalized.unmatched.length}.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
