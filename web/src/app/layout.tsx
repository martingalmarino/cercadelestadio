import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, siteUrl } from "@/lib/site";
import { organization, website } from "@/lib/structured-data";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const title = "Hoteles cerca de estadios y recitales en Argentina";
const description =
  "Hoteles por distancia al Monumental, Movistar Arena, Vélez, Kempes y más. Cómo llegar, cómo volver y dónde dormir la noche del recital o del partido.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: title,
    template: "%s | cercadelestadio",
  },
  description,
  openGraph: {
    siteName: "cercadelestadio",
    locale: "es_AR",
    type: "website",
    title,
    description,
    url: absoluteUrl("/"),
  },
  twitter: { card: "summary_large_image" },
  verification: {
    google: "YrsGpkRGrqOvPCkB8aZsxNscQZSsnoMa4WC8fGbfYXQ",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={inter.variable}>
      <body>
        <JsonLd data={[organization(), website()]} />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
