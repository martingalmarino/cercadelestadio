import { ogImage, ogSize } from "@/lib/og-image";

export const alt = "Hoteles cerca de estadios y recitales en Argentina";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Hoteles cerca de estadios y recitales");
}
