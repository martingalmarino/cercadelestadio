import { siteUrl } from "../../src/lib/site";

const GAP_MS = 1000;
const lastRequestAt = new Map<string, number>();

export const REQUEST_TIMEOUT_MS = 15_000;
export const USER_AGENT = `cercadelestadio-bot (+${siteUrl()})`;

export async function waitForHost(host: string) {
  const now = Date.now();
  const earliest = (lastRequestAt.get(host) ?? 0) + GAP_MS;
  const delay = earliest - now;
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastRequestAt.set(host, Date.now());
}

export async function fetchText(url: string, timeoutMs = REQUEST_TIMEOUT_MS) {
  const host = new URL(url).host;
  await waitForHost(host);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/xml, text/html, */*",
        "User-Agent": USER_AGENT,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} en ${url}`);
    }
    return await response.text();
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      throw new Error(`Tiempo de espera agotado en ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
