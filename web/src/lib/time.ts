import { cacheLife } from "next/cache";

export async function getCachedNow() {
  "use cache";
  cacheLife("hours");
  return Date.now();
}
