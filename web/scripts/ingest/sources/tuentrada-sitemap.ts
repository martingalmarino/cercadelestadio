import { USER_AGENT } from "../http";
import type { IngestSource } from "../types";
import { collectSitemapEvents } from "./sitemap-html";

const ORIGIN = "https://tuentrada.com";

export const tuentradaSitemap: IngestSource = {
  name: "tuentrada-sitemap",
  kind: "ticketera",
  enabled: false,
  fetch(ctx) {
    return collectSitemapEvents(ctx, {
      source: "tuentrada-sitemap",
      sitemapUrl: `${ORIGIN}/sitemap.xml`,
      robotsUrl: `${ORIGIN}/robots.txt`,
      userAgent: USER_AGENT,
    });
  },
};
