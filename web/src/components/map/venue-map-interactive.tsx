"use client";

import { circle } from "@turf/circle";
import { LngLatBounds, Map, Marker, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { formatKm } from "@/lib/format";
import { venueMapStyle } from "@/lib/map-style";
import type { VenueOutline } from "@/lib/types";
import styles from "./venue-map.module.css";

type MapHotel = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
};

const RINGS = [1, 3, 5] as const;
const ATTRIBUTION =
  '<a href="/copyright">© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors</a>';

function closeAttribution(container: HTMLElement) {
  const details = container.querySelector(".maplibregl-ctrl-attrib");
  if (!(details instanceof HTMLDetailsElement)) return;
  details.classList.remove("maplibregl-compact-show");
  details.removeAttribute("open");
}

function square(lng: number, lat: number): VenueOutline {
  const dLng = 0.00035 / Math.cos((lat * Math.PI) / 180);
  const dLat = 0.00028;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lng - dLng, lat - dLat],
          [lng + dLng, lat - dLat],
          [lng + dLng, lat + dLat],
          [lng - dLng, lat + dLat],
          [lng - dLng, lat - dLat],
        ],
      ],
    },
  };
}

function northPoint(ring: number[][]) {
  return ring.reduce((best, position) => (position[1] > best[1] ? position : best));
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function VenueMapInteractive({
  venue,
  outline,
  hotels,
  activeSlug,
  onActiveChange,
  onReady,
}: {
  venue: { name: string; lat: number; lng: number };
  outline: VenueOutline | null;
  hotels: MapHotel[];
  activeSlug: string | null;
  onActiveChange: (slug: string) => void;
  onReady: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const onActiveRef = useRef(onActiveChange);
  const onReadyRef = useRef(onReady);
  const hotelsRef = useRef(hotels);
  const activeRef = useRef(activeSlug);

  useEffect(() => {
    onActiveRef.current = onActiveChange;
    onReadyRef.current = onReady;
    hotelsRef.current = hotels;
    activeRef.current = activeSlug;
  });

  const hotelKey = hotels.map((hotel) => hotel.slug).join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    // El bundler no deja el worker al lado del chunk. El archivo público es el de esta versión de MapLibre.
    setWorkerUrl("/maplibre-gl-worker.mjs");
    const markers = new globalThis.Map<string, Marker>();
    markersRef.current = markers;
    const map = new Map({
      container,
      style: venueMapStyle(),
      center: [venue.lng, venue.lat],
      zoom: 13,
      attributionControl: { compact: true, customAttribution: ATTRIBUTION },
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false,
      fadeDuration: reducedMotion() ? 0 : 300,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText":
          "Usá Ctrl y la rueda para hacer zoom en el mapa.",
        "CooperativeGesturesHandler.MacHelpText":
          "Usá ⌘ y la rueda para hacer zoom en el mapa.",
        "CooperativeGesturesHandler.MobileHelpText": "Usá dos dedos para mover el mapa.",
      },
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    const paintActive = () => {
      for (const [slug, marker] of markersRef.current) {
        const element = marker.getElement();
        const active = slug === activeRef.current;
        element.classList.toggle(styles.pinActive, active);
        element.style.zIndex = active ? "3" : "1";
      }
    };

    map.on("load", () => {
      if (cancelled) return;
      map.getCanvas().setAttribute("aria-hidden", "true");

      const footprint = outline ?? square(venue.lng, venue.lat);
      map.addSource("venue-outline", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: footprint.properties ?? {},
          geometry: footprint.geometry,
        },
      });
      map.addLayer({
        id: "venue-outline-fill",
        type: "fill",
        source: "venue-outline",
        paint: { "fill-color": "#141414", "fill-opacity": 0.85 },
      });
      map.addLayer({
        id: "venue-outline-line",
        type: "line",
        source: "venue-outline",
        paint: { "line-color": "#141414", "line-width": 1.5 },
      });

      const ringFeatures = RINGS.map((kilometers) =>
        circle([venue.lng, venue.lat], kilometers, { steps: 96, units: "kilometers" }),
      );
      map.addSource("venue-rings", {
        type: "geojson",
        data: { type: "FeatureCollection", features: ringFeatures },
      });
      map.addLayer({
        id: "venue-rings",
        type: "line",
        source: "venue-rings",
        paint: { "line-color": "#00704a", "line-width": 1.5, "line-dasharray": [2, 2] },
      });
      map.addSource("venue-ring-labels", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: ringFeatures.map((feature, index) => ({
            type: "Feature" as const,
            properties: { label: `${RINGS[index]} KM` },
            geometry: { type: "Point" as const, coordinates: northPoint(feature.geometry.coordinates[0]) },
          })),
        },
      });
      map.addLayer({
        id: "venue-ring-labels",
        type: "symbol",
        source: "venue-ring-labels",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
          "text-anchor": "bottom",
          "text-offset": [0, -0.15],
        },
        paint: {
          "text-color": "#00704a",
          "text-halo-color": "#ebebeb",
          "text-halo-width": 1,
        },
      });

      const bounds = new LngLatBounds();
      for (const position of ringFeatures[1].geometry.coordinates[0]) {
        bounds.extend(position as [number, number]);
      }
      hotelsRef.current.forEach((hotel, index) => {
        if (hotel.distanceKm > 3) bounds.extend([hotel.lng, hotel.lat]);
        const element = document.createElement("button");
        element.type = "button";
        element.className = styles.pin;
        element.textContent = String(index + 1);
        element.setAttribute(
          "aria-label",
          `Hotel ${index + 1}: ${hotel.name}, ${formatKm(hotel.distanceKm)}`,
        );
        const select = () => onActiveRef.current(hotel.slug);
        element.addEventListener("click", select);
        element.addEventListener("mouseenter", select);
        element.addEventListener("focus", select);
        const marker = new Marker({ element, anchor: "center" })
          .setLngLat([hotel.lng, hotel.lat])
          .addTo(map);
        markers.set(hotel.slug, marker);
      });
      paintActive();
      map.resize();
      map.fitBounds(bounds, { padding: 36, animate: false, duration: 0 });
      closeAttribution(container);
      map.once("idle", () => {
        if (!cancelled) closeAttribution(container);
      });
      onReadyRef.current();
    });

    return () => {
      cancelled = true;
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [hotelKey, outline, venue.lat, venue.lng]);

  useEffect(() => {
    const map = mapRef.current;
    for (const [slug, marker] of markersRef.current) {
      const element = marker.getElement();
      const active = slug === activeSlug;
      element.classList.toggle(styles.pinActive, active);
      element.style.zIndex = active ? "3" : "1";
    }
    if (!map || !activeSlug || !map.isStyleLoaded()) return;
    const hotel = hotelsRef.current.find((item) => item.slug === activeSlug);
    if (!hotel) return;
    const bounds = map.getBounds();
    if (bounds.contains([hotel.lng, hotel.lat])) return;
    if (reducedMotion()) map.jumpTo({ center: [hotel.lng, hotel.lat] });
    else map.easeTo({ center: [hotel.lng, hotel.lat], duration: 500 });
  }, [activeSlug]);

  return <div ref={containerRef} className={styles.map} />;
}
