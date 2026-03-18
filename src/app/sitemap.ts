import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

const staticRoutes = [
  "",
  "/signin",
  "/how-it-works",
  "/contact",
  "/careers",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/signin" ? 0.7 : 0.6,
  }));
}
