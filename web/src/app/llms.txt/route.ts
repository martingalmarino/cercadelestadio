import { getEvents, getVenue, getVenues } from "@/lib/content";
import { upcomingEvents } from "@/lib/events";
import { formatFullDate, monthName } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { getCachedNow } from "@/lib/time";

function eventWhen(date: string, dateExact: boolean) {
  if (!dateExact) return `${monthName(date)} de ${date.slice(0, 4)}`;
  return formatFullDate(date);
}

export async function GET() {
  const now = await getCachedNow();
  const venues = getVenues();
  const events = upcomingEvents(getEvents(), now);
  const stadiums = venues
    .map(
      (venue) =>
        `${venue.seoName} — ${absoluteUrl(`/estadio/${venue.slug}`)} — ${venue.address} — ${venue.hotelsWithin3km} hoteles a 3 km`,
    )
    .join("\n");
  const shows = events
    .map((event) => {
      const venue = event.venueSlug ? getVenue(event.venueSlug) : null;
      const place = venue?.seoName ?? "a confirmar";
      return `${event.artist} — ${eventWhen(event.date, event.dateExact)} — ${place} — ${absoluteUrl(`/evento/${event.slug}`)}`;
    })
    .join("\n");
  const body = [
    "# cercadelestadio",
    "",
    "Hoteles cerca de estadios y recitales en Argentina, ordenados por distancia.",
    "Cómo llegar, cómo volver y dónde dormir la noche del show.",
    "",
    "## Estadios",
    "",
    stadiums,
    "",
    "## Próximos eventos",
    "",
    shows || "A confirmar.",
    "",
    "## Método",
    "",
    absoluteUrl("/como-funciona"),
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "s-maxage=86400",
    },
  });
}
