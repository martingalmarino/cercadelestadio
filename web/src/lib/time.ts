import { cacheLife } from "next/cache";

/** Hora tomada en el build y al revalidar (1 h). No es la hora de cada request. */
export async function getCachedNow() {
  "use cache";
  cacheLife({
    stale: 3600,
    revalidate: 3600,
    expire: 86400,
  });
  return Date.now();
}
