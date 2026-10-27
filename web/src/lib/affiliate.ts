import type { Hotel } from "@/lib/types";

const SEARCH_URL = "https://www.booking.com/searchresults.html";

function withTracking(url: URL, subId: string) {
  url.searchParams.set("lang", "es-ar");
  url.searchParams.set("selected_currency", "ARS");
  url.searchParams.set("label", subId);
  const affiliateId = process.env.AFFILIATE_ID?.trim();
  if (affiliateId) url.searchParams.set("aid", affiliateId);
  return url.toString();
}

export function affiliateHref(subId: string, place: { lat: number; lng: number }) {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("latitude", String(place.lat));
  url.searchParams.set("longitude", String(place.lng));
  url.searchParams.set("dest_type", "latlong");
  url.searchParams.set("radius", "3");
  return withTracking(url, subId);
}

export function hotelBookingHref(
  hotel: Pick<Hotel, "bookingStatus" | "bookingUrl" | "lat" | "lng">,
  venue: { name: string },
  subId: string,
): string | null {
  if (hotel.bookingStatus === "no-en-booking") return null;
  if (hotel.bookingStatus === "ficha") {
    if (!hotel.bookingUrl) return null;
    return withTracking(new URL(hotel.bookingUrl), subId);
  }
  const url = new URL(SEARCH_URL);
  const stadium = venue.name;
  url.searchParams.set("ss", stadium);
  url.searchParams.set("latitude", String(hotel.lat));
  url.searchParams.set("longitude", String(hotel.lng));
  url.searchParams.set("dest_type", "latlong");
  url.searchParams.set("radius", "1");
  return withTracking(url, subId);
}

export function hotelBookingLinks(
  hotels: readonly Hotel[],
  venue: { name: string },
  subId: string,
) {
  const links: Record<string, string> = {};
  for (const hotel of hotels) {
    const href = hotelBookingHref(hotel, venue, subId);
    if (href) links[hotel.slug] = href;
  }
  return links;
}
