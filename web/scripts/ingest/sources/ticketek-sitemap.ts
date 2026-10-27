import { USER_AGENT } from "../http";
import type { IngestSource } from "../types";
import { collectSitemapEvents } from "./sitemap-html";

const ORIGIN = "https://www.ticketek.com.ar";

export const ticketekSitemap: IngestSource = {
  name: "ticketek-sitemap",
  kind: "ticketera",
  enabled: false,
  fetch(ctx) {
    return collectSitemapEvents(ctx, {
      source: "ticketek-sitemap",
      sitemapUrl: `${ORIGIN}/sitemap.xml`,
      robotsUrl: `${ORIGIN}/robots.txt`,
      userAgent: USER_AGENT,
    });
  },
};
