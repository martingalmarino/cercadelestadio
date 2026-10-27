import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "cercadelestadio",
    short_name: "cercadelestadio",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    theme_color: "#00704a",
    background_color: "#ebebeb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
