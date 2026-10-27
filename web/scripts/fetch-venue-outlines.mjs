import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import osmtogeojson from "osmtogeojson";

const USER_AGENT = "cercadelestadio/1.0 (https://cercadelestadio.com)";
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const MAX_BYTES = 30 * 1024;

const contentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "content");
const venuesPath = path.join(contentDir, "venues.json");
const outDir = path.join(contentDir, "outlines");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function overpassQuery(osm) {
  const element = osm.type === "relation" ? "relation" : "way";
  return `[out:json][timeout:25];\n${element}(${osm.id});\nout geom;`;
}

async function fetchOverpass(osm) {
  const body = new URLSearchParams({ data: overpassQuery(osm) });
  let lastError = new Error("Overpass no respondió");

  for (const url of OVERPASS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
        },
        body,
        signal: AbortSignal.timeout(40_000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const json = await response.json();
      if (!json.elements?.length) throw new Error("respuesta vacía");
      return json;
    } catch (error) {
      lastError = error;
      console.warn(`${url} falló (${osm.type} ${osm.id}): ${error.message}`);
    }
  }

  throw lastError;
}

function nominatimId(osm) {
  const prefix = osm.type === "relation" ? "R" : "W";
  return `${prefix}${osm.id}`;
}

async function fetchNominatim(osm) {
  await sleep(1100);
  const url = new URL("https://nominatim.openstreetmap.org/lookup");
  url.searchParams.set("osm_ids", nominatimId(osm));
  url.searchParams.set("format", "geojson");
  url.searchParams.set("polygon_geojson", "1");
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  return response.json();
}

function ringArea(ring) {
  let area = 0;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    area += (ring[previous][0] + ring[index][0]) * (ring[previous][1] - ring[index][1]);
  }
  return Math.abs(area / 2);
}

function geometryArea(geometry) {
  if (geometry.type === "Polygon") return ringArea(geometry.coordinates[0]);
  return geometry.coordinates.reduce((sum, polygon) => sum + ringArea(polygon[0]), 0);
}

function isStadium(properties = {}) {
  const tags = properties.tags ?? properties;
  return tags.leisure === "stadium" || tags.building === "stadium";
}

function polygonFeatures(collection) {
  const features = collection.type === "Feature" ? [collection] : (collection.features ?? []);
  return features.filter(
    (feature) => feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon",
  );
}

function pickPolygon(collection) {
  const polygons = polygonFeatures(collection);
  if (!polygons.length) return null;
  const stadiums = polygons.filter((feature) => isStadium(feature.properties));
  const pool = stadiums.length ? stadiums : polygons;
  return pool.reduce((best, feature) =>
    geometryArea(feature.geometry) > geometryArea(best.geometry) ? feature : best,
  );
}

function roundPosition(position) {
  return [Math.round(position[0] * 1e6) / 1e6, Math.round(position[1] * 1e6) / 1e6];
}

function closeRing(ring) {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, [...first]];
}

function roundGeometry(geometry) {
  if (geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geometry.coordinates.map((ring) => closeRing(ring.map(roundPosition))),
    };
  }
  return {
    type: "MultiPolygon",
    coordinates: geometry.coordinates.map((polygon) =>
      polygon.map((ring) => closeRing(ring.map(roundPosition))),
    ),
  };
}

function assertPolygon(geometry) {
  const rings = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  for (const ring of rings) {
    if (ring.length < 4) throw new Error("anillo demasiado corto");
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) throw new Error("anillo abierto");
  }
}

function haversineKm(lat, lng, venue) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(venue.lat - lat);
  const dLng = toRad(venue.lng - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(venue.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function centroid(geometry) {
  const ring = geometry.type === "Polygon" ? geometry.coordinates[0] : geometry.coordinates[0][0];
  const points = ring.slice(0, -1);
  const lng = points.reduce((sum, position) => sum + position[0], 0) / points.length;
  const lat = points.reduce((sum, position) => sum + position[1], 0) / points.length;
  return { lat, lng };
}

async function outlineFor(venue) {
  try {
    const json = await fetchOverpass(venue.osm);
    const feature = pickPolygon(osmtogeojson(json));
    if (!feature) throw new Error("sin polígono");
    return { feature, source: "overpass" };
  } catch (error) {
    console.warn(`Overpass agotado para ${venue.slug}: ${error.message}. Pruebo Nominatim.`);
    const feature = pickPolygon(await fetchNominatim(venue.osm));
    if (!feature) throw new Error("Nominatim no devolvió un polígono");
    return { feature, source: "nominatim" };
  }
}

async function main() {
  const venues = JSON.parse(readFileSync(venuesPath, "utf8"));
  mkdirSync(outDir, { recursive: true });
  const failures = [];

  for (const [index, venue] of venues.entries()) {
    if (index > 0) await sleep(1000);
    if (!venue.osm || (venue.osm.type !== "way" && venue.osm.type !== "relation")) {
      failures.push(`${venue.slug}: sin osm de tipo way o relation`);
      continue;
    }

    try {
      const { feature, source } = await outlineFor(venue);
      const geometry = roundGeometry(feature.geometry);
      assertPolygon(geometry);
      const center = centroid(geometry);
      const drift = haversineKm(center.lat, center.lng, venue);
      if (drift > 1) {
        throw new Error(`el contorno queda a ${drift.toFixed(2)} km del estadio`);
      }

      const output = {
        type: "Feature",
        properties: {
          osmType: venue.osm.type,
          osmId: venue.osm.id,
          source,
          fetchedAt: new Date().toISOString(),
        },
        geometry,
      };
      const text = `${JSON.stringify(output, null, 2)}\n`;
      const bytes = Buffer.byteLength(text);
      if (bytes >= MAX_BYTES) throw new Error(`pesa ${bytes} bytes`);
      writeFileSync(path.join(outDir, `${venue.slug}.geojson`), text);
      console.log(`${venue.slug}: ${geometry.type} vía ${source}, ${bytes} bytes, a ${drift.toFixed(2)} km`);
    } catch (error) {
      failures.push(`${venue.slug}: ${error.message}`);
      console.error(`${venue.slug}: ${error.message}`);
    }
  }

  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  }
}

main();
