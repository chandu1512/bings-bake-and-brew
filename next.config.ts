import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async redirects() {
    return [
      { source: "/location", destination: "/visit", permanent: true },
      // Old links like /menu?store=elkton open that shop's own menu page.
      {
        source: "/menu",
        has: [{ type: "query", key: "store", value: "(?<store>amstel|elkton)" }],
        destination: "/menu/:store",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
