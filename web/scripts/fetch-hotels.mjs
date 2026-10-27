#!/usr/bin/env node
// Uso (desde web/): node scripts/fetch-hotels.mjs [--out content/hotels.json]
// Trae hoteles reales de OpenStreetMap (Overpass, con mirrors) alrededor de cada estadio.
// Datos © OpenStreetMap contributors, ODbL 1.0.
import { readFileSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
const OUT = args.includes("--out") ? args[args.indexOf("--out") + 1] : "content/hotels.json";
const VENUES = args.includes("--venues") ? args[args.indexOf("--venues") + 1] : "content/venues.json";
const CITIES = VENUES.replace("venues.json", "cities.json");
const RADIUS = 5000, MIN = 8, MAX = 15;
const UA = "cercadelestadio.com hotel-fetch (contacto: martingalmarino)";
const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const TYPE_RANK = { hotel: 0, apartment: 1, guest_house: 2, hostel: 3 };
const TYPE_LABEL = { hotel: "Hotel", apartment: "Apart / departamento", guest_house: "Hospedaje", hostel: "Hostel" };
// Excluye moteles/albergues transitorios y nombres genéricos o que son solo una dirección
const EXCLUDE = /\b(motel|albergue|telo|viviendas?)\b/i;
const GENERIC = /^(hotel|hostel|casa|pension|pensión|hospedaje|apart)$/i;
const isGood = (n) => !EXCLUDE.test(n) && !GENERIC.test(n.trim()) && !/^[\p{L} .]+ \d+$/u.test(n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function haversine(a, b, c, d) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const slugify = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
async function overpass(q) {
  if (process.env.SKIP_OVERPASS) throw new Error("skip");
  for (const url of MIRRORS) {
    for (let i = 0; i < 2; i++) {
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 60000);
        const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, signal: ctl.signal });
        clearTimeout(t);
        if (res.ok) return { mirror: url, data: await res.json() };
        console.error(`  ${url} -> ${res.status}`);
      } catch (e) { console.error(`  ${url} -> ${e.name}`); }
      await sleep(3000);
    }
  }
  throw new Error("Todos los mirrors de Overpass fallaron");
}
// Respaldo: Nominatim (1 req/s, User-Agent propio). Divide el radio en 4 cuadrantes para no topar en 50 resultados.
async function nominatim(v) {
  const dLat = RADIUS / 111320, dLng = RADIUS / (111320 * Math.cos((v.lat * Math.PI) / 180));
  const boxes = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) => [v.lng - dLng + j * dLng, v.lat + dLat - i * dLat, v.lng + j * dLng, v.lat - i * dLat]);
  const els = new Map();
  for (const term of ["hotel", "hostel", "apartment", "guest house"]) for (const b of boxes) {
    const u = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(term)}&viewbox=${b.join(",")}&bounded=1&limit=50&extratags=1&addressdetails=1`;
    const res = await fetch(u, { headers: { "User-Agent": UA, "Accept-Language": "es" } });
    await sleep(1100);
    if (!res.ok) { console.error(`  nominatim ${res.status}`); continue; }
    for (const r of await res.json()) {
      if (r.category !== "tourism" || !TYPE_RANK.hasOwnProperty(r.type) || !r.name) continue;
      const a = r.address ?? {}, x = r.extratags ?? {};
      els.set(r.osm_type + r.osm_id, { type: r.osm_type, id: r.osm_id, lat: Number(r.lat), lon: Number(r.lon), tags: { ...x, name: r.name, tourism: r.type,
        "addr:street": a.road, "addr:housenumber": a.house_number, "addr:suburb": a.suburb || a.neighbourhood, "addr:city": a.city || a.town } });
    }
  }
  return { mirror: "nominatim", data: { elements: [...els.values()] } };
}
const venues = JSON.parse(readFileSync(VENUES, "utf8"));
const cities = Object.fromEntries(JSON.parse(readFileSync(CITIES, "utf8")).map((c) => [c.slug, c.name]));
const out = [], seen = new Set();
for (const v of venues) {
  const q = `[out:json][timeout:50];nwr(around:${RADIUS},${v.lat},${v.lng})["tourism"~"^(hotel|hostel|apartment|guest_house)$"]["name"];out center tags;`;
  console.error(`${v.slug}…`);
  const { mirror, data } = await overpass(q).catch((e) => { console.error(`  Overpass: ${e.message}; uso Nominatim`); return nominatim(v); });
  const list = data.elements.map((e) => {
    const t = e.tags, lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
    const d = haversine(v.lat, v.lng, lat, lng);
    const stars = /^[1-5]$/.test(t.stars ?? "") ? Number(t.stars) : null;
    const street = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
    const address = street ? [street, t["addr:suburb"] || t["addr:city"]].filter(Boolean).join(", ") : null;
    return { e, t, lat, lng, d, stars, address };
  }).filter((h) => h.d <= RADIUS / 1000 && isGood(h.t.name) && h.lat && h.t.name && !/^(disused|abandoned)/.test(h.t.tourism));
  // Prioridad: cercanía, pero hoteles antes que el resto dentro de una ventana de 500 m
  list.sort((a, b) => (a.d + TYPE_RANK[a.t.tourism] * 0.5) - (b.d + TYPE_RANK[b.t.tourism] * 0.5));
  const picked = [];
  for (const h of list) {
    const key = slugify(h.t.name);
    if (picked.some((p) => slugify(p.t.name) === key)) continue;
    picked.push(h); if (picked.length >= MAX) break;
  }
  if (picked.length < MIN) console.error(`  AVISO: solo ${picked.length} alojamientos en ${RADIUS / 1000} km`);
  for (const h of picked.sort((a, b) => a.d - b.d)) {
    let slug = slugify(h.t.name); if (seen.has(slug)) slug += "-" + v.slug; seen.add(slug);
    const km = Math.round(h.d * 10) / 10;
    const detailParts = [h.stars ? `${h.stars} estrellas` : TYPE_LABEL[h.t.tourism]];
    out.push({
      slug, venueSlug: v.slug, name: h.t.name,
      detail: detailParts.join(" · "),
      neighborhood: h.t["addr:suburb"] || h.t["addr:city"] || v.neighborhood,
      walkMinutes: Math.max(1, Math.round((h.d / 4.5) * 60)), // estimado, línea recta a 4,5 km/h
      driveMinutes: Math.max(2, Math.round((h.d * 1.4 / 25) * 60)), // estimado, 25 km/h urbano, factor 1,4
      distanceKm: km,
      pricePerNight: null,
      source: "osm",
      osm: { type: h.e.type, id: h.e.id },
      lat: Number(h.lat.toFixed(6)), lng: Number(h.lng.toFixed(6)),
      kind: h.t.tourism,
      stars: h.stars,
      address: h.address,
      website: h.t.website || h.t["contact:website"] || null,
      city: cities[v.citySlug] ?? null,
    });
  }
  console.error(`  ${picked.length} (de ${list.length}) vía ${mirror}`);
  await sleep(2000);
}
// Booking: conservar lo verificado a mano (bookingUrl/bookingStatus) del hotels.json anterior por osm id.
// Hoteles nuevos entran como "busqueda-geo" (link por coordenadas). NUNCA armar link por nombre suelto:
// Booking resuelve nombres ambiguos a otro país (ej. "Park Hotel La Plata" -> Cádiz, España).
let prev = [];
try { prev = JSON.parse(readFileSync(OUT, "utf8")); } catch {}
const prevByOsm = new Map(prev.map((p) => [`${p.osm?.type}/${p.osm?.id}`, p]));
for (const h of out) {
  const p = prevByOsm.get(`${h.osm.type}/${h.osm.id}`);
  if (p?.bookingStatus) {
    h.bookingStatus = p.bookingStatus; h.bookingUrl = p.bookingUrl ?? null;
    if (p.bookingName) h.bookingName = p.bookingName;
    if (p.bookingNote) h.bookingNote = p.bookingNote;
  } else {
    h.bookingStatus = "busqueda-geo"; h.bookingUrl = null; // el helper arma la URL por lat/lng
  }
}
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.error(`OK ${out.length} alojamientos -> ${OUT}`);
