"use client";

import { HotelList } from "@/components/hotel-list";
import type { Hotel, VenueOutline } from "@/lib/types";
import { useState } from "react";
import { VenueMap } from "./venue-map";

export function VenueHotels({
  venue,
  outline,
  hotels,
  subId,
  place,
}: {
  venue: { name: string; lat: number; lng: number };
  outline: VenueOutline | null;
  hotels: Hotel[];
  subId: string;
  place: string;
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  return (
    <>
      <VenueMap
        venue={venue}
        outline={outline}
        hotels={hotels}
        activeSlug={activeSlug}
        onActiveChange={setActiveSlug}
      />
      <HotelList
        hotels={hotels}
        subId={subId}
        place={place}
        activeSlug={activeSlug}
        onActiveChange={setActiveSlug}
      />
    </>
  );
}
