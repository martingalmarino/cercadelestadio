import { getVenue, getVenues } from "@/lib/content";
import { ogImage, ogSize } from "@/lib/og-image";
import { venueTitle } from "@/lib/seo";
import { notFound } from "next/navigation";

export const alt = "Hoteles cerca del estadio";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return getVenues().map((venue) => ({ slug: venue.slug }));
}

export default async function Image({ params }: PageProps<"/estadio/[slug]">) {
  const { slug } = await params;
  const venue = getVenue(slug);
  if (!venue) notFound();
  return ogImage(venueTitle(venue));
}
