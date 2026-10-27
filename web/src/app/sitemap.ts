import {
  getCities,
  getEvents,
  getVenues,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/copyright"), changeFrequency: "yearly", priority: 0.2 },
  ];
  const cities: MetadataRoute.Sitemap = getCities().map((city) => ({
    url: absoluteUrl(`/ciudad/${city.slug}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const venues: MetadataRoute.Sitemap = getVenues().map((venue) => ({
    url: absoluteUrl(`/estadio/${venue.slug}`),
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const events: MetadataRoute.Sitemap = getEvents().map((event) => ({
    url: absoluteUrl(`/evento/${event.slug}`),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...staticPages, ...cities, ...venues, ...events];
}
