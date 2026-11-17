import type { NextConfig } from "next";

/**
 * Fully static export for SiteGround (Apache, no Node). `npm run build` writes
 * the whole site to out/. Ordering happens on Toast, so nothing needs a server.
 * Redirects live in public/.htaccess (Next.js redirects don't run in an export).
 */
const nextConfig: NextConfig = {
  output: "export",
  // Every page is a folder with index.html (menu/amstel/index.html), served at /menu/amstel/.
  trailingSlash: true,
  // No image server in a static export: images ship as they are (already WebP/JPEG at sensible sizes).
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;
