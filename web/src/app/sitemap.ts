import { getCities, getEvents, getVenues } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

const builtAt = new Date();

function lastModified(updatedAt?: string) {
  if (!updatedAt) return builtAt;
  const parsed = new Date(updatedAt);
  return Number.isNaN(parsed.getTime()) ? builtAt : parsed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: builtAt,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/como-funciona"),
      lastModified: builtAt,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
  const cities: MetadataRoute.Sitemap = getCities().map((city) => ({
    url: absoluteUrl(`/ciudad/${city.slug}`),
    lastModified: builtAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const venues: MetadataRoute.Sitemap = getVenues().map((venue) => ({
    url: absoluteUrl(`/estadio/${venue.slug}`),
    lastModified: lastModified(venue.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const events: MetadataRoute.Sitemap = getEvents().map((event) => ({
    url: absoluteUrl(`/evento/${event.slug}`),
    lastModified: lastModified(event.updatedAt),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...home, ...cities, ...venues, ...events];
}
