const SEARCH_URL = "https://www.booking.com/searchresults.html";

export function affiliateHref(subId: string, query: string) {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("ss", query);
  url.searchParams.set("lang", "es");
  url.searchParams.set("label", subId);
  const affiliateId = process.env.AFFILIATE_ID?.trim();
  if (affiliateId) url.searchParams.set("aid", affiliateId);
  return url.toString();
}
