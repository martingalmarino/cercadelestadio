const DEFAULT_SITE_URL = "https://cercadelestadio.com";

export function siteUrl() {
  const value = process.env.SITE_URL?.trim() || DEFAULT_SITE_URL;
  return value.replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  if (path === "/") return siteUrl();
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
