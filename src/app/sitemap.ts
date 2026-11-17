import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Written once at build time for the static export.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; freq: "weekly" | "monthly" }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/menu", priority: 0.7, freq: "monthly" },
    { path: "/menu/amstel", priority: 0.9, freq: "weekly" },
    { path: "/menu/elkton", priority: 0.9, freq: "weekly" },
    { path: "/order", priority: 0.8, freq: "weekly" },
    { path: "/visit", priority: 0.8, freq: "monthly" },
    { path: "/gift-cards", priority: 0.5, freq: "monthly" },
  ];
  return pages.map((p) => ({
    // Every page is served at its trailing-slash URL (trailingSlash: true in next.config).
    url: `${SITE_URL}${p.path}/`,
    lastModified: new Date(),
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
