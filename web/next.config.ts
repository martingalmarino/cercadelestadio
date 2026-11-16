import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/evento/velez-sarsfield-vs-belgrano-jose-amalfitani-2026-11-22",
        destination: "/evento/velez-sarsfield-vs-belgrano-jose-amalfitani-2026-11-20",
        permanent: true,
      },
      {
        source: "/evento/eros-ramazzotti-movistar-arena-2027-11-06",
        destination: "/evento/eros-ramazzotti-movistar-arena-2026-11-06",
        permanent: true,
      },
      {
        source: "/evento/disney-movistar-arena-2026-12-22-2",
        destination: "/evento/disney-movistar-arena-2026-12-23",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
