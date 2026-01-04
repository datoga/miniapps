import type { MetadataRoute } from "next";
import { generateSitemap } from "@miniapps/seo";

const APP_URL = "https://bilbo.live";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only public pages - /app/* is private/noindex
  return generateSitemap({
    appUrl: APP_URL,
    locales: ["es", "en"],
    routes: [
      { path: "", priority: 1, changeFrequency: "weekly" },
      { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    ],
  });
}

