const DEFAULT_SITE_URL = "https://www.cercadelestadio.com";

function hostnameOf(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

/** Apex sin www, o cualquier host de Vercel. En producción no pueden ser canónicos. */
function isNonCanonicalSiteUrl(value: string) {
  const host = hostnameOf(value);
  return !host.startsWith("www.") || host.includes("vercel.app");
}

export function siteUrl() {
  const configured = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (
    process.env.VERCEL_ENV === "production" &&
    configured &&
    isNonCanonicalSiteUrl(configured)
  ) {
    return DEFAULT_SITE_URL;
  }
  return configured || DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string) {
  if (path === "/") return siteUrl();
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
