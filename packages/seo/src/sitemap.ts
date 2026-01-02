import type { MetadataRoute } from "next";

export interface SitemapRoute {
  /** Path without locale prefix (e.g., "", "/about", "/features") */
  path: string;
  /** How often the page changes (default: "monthly") */
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  /** Priority 0.0 to 1.0 (default: 0.7, homepage gets 1.0) */
  priority?: number;
}

export interface SitemapConfig {
  /** Base URL of the app (e.g., "https://myapp.com") */
  appUrl: string;
  /** List of locales (default: ["es", "en"]) */
  locales?: string[];
  /** Routes to include in sitemap */
  routes: SitemapRoute[];
  /** Last modification date (default: now) */
  lastModified?: Date;
}

/**
 * Generates a sitemap for Next.js apps with i18n support.
 * Creates entries for each route in each locale.
 */
export function generateSitemap(config: SitemapConfig): MetadataRoute.Sitemap {
  const {
    appUrl,
    locales = ["es", "en"],
    routes,
    lastModified = new Date(),
  } = config;

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      const isHomepage = route.path === "" || route.path === "/";
      sitemapEntries.push({
        url: `${appUrl}/${locale}${route.path === "/" ? "" : route.path}`,
        lastModified,
        changeFrequency: route.changeFrequency ?? (isHomepage ? "weekly" : "monthly"),
        priority: route.priority ?? (isHomepage ? 1 : 0.7),
      });
    }
  }

  return sitemapEntries;
}

