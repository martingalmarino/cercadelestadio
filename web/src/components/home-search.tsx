"use client";

import { EventRow } from "@/components/event-row";
import { RowList } from "@/components/row-list";
import { SectionBand } from "@/components/section-band";
import { Note } from "@/components/section-intro";
import { VenueCells } from "@/components/venue-cells";
import type { Venue } from "@/lib/types";
import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "@/app/home.module.css";

export type HomeEventCard = {
  slug: string;
  date: string;
  dateExact: boolean;
  artist: string;
  subtitle: string;
  place?: string;
  extra?: string;
  haystack: string;
};

export type HomeVenueCard = Venue & { haystack: string };

type Search = { query: string; fecha: string };

function fold(value: string) {
  return value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function useHomeSearch(): Search {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  const params = new URLSearchParams(raw);
  return {
    query: fold(params.get("q")?.trim() ?? ""),
    fecha: params.get("fecha")?.trim() ?? "",
  };
}

export function HomeSearchSync() {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );

  useEffect(() => {
    const params = new URLSearchParams(raw);
    const query = document.querySelector<HTMLInputElement>('input[name="q"]');
    if (query) query.value = params.get("q")?.trim() ?? "";
  }, [raw]);

  return null;
}

function isoToDmy(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function dmyToIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "";
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function maskDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function FechaField() {
  const { fecha } = useHomeSearch();
  const [draft, setDraft] = useState<string | null>(null);
  const [seen, setSeen] = useState(fecha);
  if (fecha !== seen) {
    setSeen(fecha);
    setDraft(null);
  }
  const text = draft ?? isoToDmy(fecha);

  return (
    <label>
      <span>Fecha</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        value={text}
        onChange={(event) => setDraft(maskDate(event.target.value))}
      />
      <input type="hidden" name="fecha" value={dmyToIso(text)} />
    </label>
  );
}

export function HomeEventList({
  events,
  venues,
}: {
  events: HomeEventCard[];
  venues: HomeVenueCard[];
}) {
  const { query, fecha } = useHomeSearch();
  const visible = events.filter((event) => {
    if (fecha && event.date !== fecha) return false;
    if (query && !event.haystack.includes(query)) return false;
    return true;
  });
  const visibleVenues = query
    ? venues.filter((venue) => venue.haystack.includes(query))
    : venues;
  const searching = query.length > 0 || fecha.length > 0;
  const nothing = searching && visible.length === 0 && visibleVenues.length === 0;

  if (visible.length === 0) {
    return (
      <Note>
        {nothing
          ? "No hay eventos ni estadios con esa búsqueda."
          : "No hay shows para esa búsqueda."}
      </Note>
    );
  }

  return (
    <RowList label="Próximos eventos">
      {visible.map((event) => (
        <EventRow
          key={event.slug}
          href={`/evento/${event.slug}`}
          date={event.date}
          approximate={!event.dateExact}
          title={event.artist}
          subtitle={event.subtitle}
          place={event.place}
          extra={event.extra}
        />
      ))}
    </RowList>
  );
}

export function HomeVenueSection({ venues }: { venues: HomeVenueCard[] }) {
  const { query } = useHomeSearch();
  const visible = query ? venues.filter((venue) => venue.haystack.includes(query)) : venues;

  return (
    <section id="estadios" aria-labelledby="titulo-estadios">
      <SectionBand
        index="02"
        title="Estadios y recintos"
        titleId="titulo-estadios"
        meta={`${visible.length} recintos`}
      />
      <div className={`container ${styles.block}`}>
        {visible.length === 0 ? (
          <Note>No hay estadios con esa búsqueda.</Note>
        ) : (
          <VenueCells venues={visible} />
        )}
      </div>
    </section>
  );
}
