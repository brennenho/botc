import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

const publicRoutes = [
  { path: "/", priority: 1 },
  { path: "/how-it-works", priority: 0.8 },
  { path: "/characters", priority: 0.8 },
  { path: "/tb", priority: 0.7 },
  { path: "/bmr", priority: 0.7 },
  { path: "/snv", priority: 0.7 },
  { path: "/travellers", priority: 0.7 },
  { path: "/privacy", priority: 0.2 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map(({ path, priority }) => ({
    url: new URL(path, siteConfig.url).toString(),
    changeFrequency: "monthly",
    priority,
  }));
}
