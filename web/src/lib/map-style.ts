import type { StyleSpecification } from "maplibre-gl";
import baseStyle from "./map-style.base.json";

const LAND = "#ebebeb";
const WATER = "#dcdcdc";
const PARK = "#e3f1ea";
const ROAD = "#ffffff";
const CASING = "#c4c4c4";
const BUILDING = "#dcdcdc";
const LABEL = "#5f5f5f";

const DROPPED = new Set([
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us",
  "airport",
  "highway-name-path",
  "highway-name-minor",
]);

type StyleLayer = {
  id: string;
  type: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  source?: string;
  "source-layer"?: string;
  filter?: unknown;
  minzoom?: number;
};

function paintLayer(layer: StyleLayer) {
  const paint = layer.paint ?? {};
  layer.paint = paint;

  if (layer.type === "background") {
    paint["background-color"] = LAND;
    return;
  }

  if (layer.type === "fill") {
    const park = layer.id === "park" || layer.id === "landcover_wood";
    const water = layer.id === "water";
    const building = layer.id === "building";
    paint["fill-color"] = park ? PARK : water ? WATER : building ? BUILDING : LAND;
    if (building) paint["fill-outline-color"] = CASING;
    return;
  }

  if (layer.type === "line") {
    const water = layer.id.includes("water");
    const casing = layer.id.includes("casing");
    const quiet = layer.id.includes("boundary") || layer.id.includes("railway");
    paint["line-color"] = water ? WATER : casing || quiet ? CASING : ROAD;
    return;
  }

  if (layer.type === "symbol") {
    paint["text-color"] = LABEL;
    paint["text-halo-color"] = LAND;
    paint["text-halo-width"] = 1;
    if (layer.layout) delete layer.layout["icon-image"];
  }
}

const neighbourhood: StyleLayer = {
  id: "label_neighbourhood",
  type: "symbol",
  source: "openmaptiles",
  "source-layer": "place",
  minzoom: 12,
  filter: ["match", ["get", "class"], ["neighbourhood", "suburb", "quarter"], true, false],
  layout: {
    "text-field": ["coalesce", ["get", "name:es"], ["get", "name"]],
    "text-font": ["Noto Sans Regular"],
    "text-size": 13,
  },
  paint: {
    "text-color": LABEL,
    "text-halo-color": LAND,
    "text-halo-width": 1,
  },
};

export function venueMapStyle(): StyleSpecification {
  const style = structuredClone(baseStyle) as StyleSpecification & {
    layers: StyleLayer[];
    sources: Record<string, { attribution?: string }>;
  };

  for (const source of Object.values(style.sources)) {
    // Cadena vacía pisa la atribución del TileJSON. Si se borra la clave, MapLibre vuelve a leerla.
    source.attribution = "";
  }

  style.layers = style.layers.filter((layer) => !DROPPED.has(layer.id));
  for (const layer of style.layers) paintLayer(layer);
  style.layers.push(neighbourhood);
  return style;
}
