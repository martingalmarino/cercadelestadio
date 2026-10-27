import { getEvent, getEvents } from "@/lib/content";
import { formatFullDate, monthName } from "@/lib/format";
import { ogImage, ogSize } from "@/lib/og-image";
import { notFound } from "next/navigation";

export const alt = "Hoteles para el recital";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return getEvents().map((event) => ({ slug: event.slug }));
}

function eventDate(date: string, dateExact: boolean) {
  if (!dateExact) return `${monthName(date)} de ${date.slice(0, 4)}`;
  return formatFullDate(date);
}

export default async function Image({ params }: PageProps<"/evento/[slug]">) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  return ogImage(`${event.artist} · ${eventDate(event.date, event.dateExact)}`);
}
