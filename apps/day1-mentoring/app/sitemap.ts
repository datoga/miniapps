import type { MetadataRoute } from "next";

const APP_URL = "https://mentorflow.space";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["es", "en"];
  const routes = ["", "/dashboard", "/about"];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      sitemapEntries.push({
        url: `${APP_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "weekly" : "daily",
        priority: route === "" ? 1 : route === "/dashboard" ? 0.9 : 0.7,
      });
    }
  }

  return sitemapEntries;
}

