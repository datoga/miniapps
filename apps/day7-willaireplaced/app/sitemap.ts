import type { MetadataRoute } from "next";
import { getAllLocalizedSlugs, getDataset } from "@/lib/professions/load.server";

const APP_URL = "https://willaireplaced.com";
const locales = ["en", "es"] as const;

type AlternateRefs = {
  languages: Record<string, string>;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const dataset = getDataset();
  const now = new Date();

  // Base routes for each locale with alternates
  const baseRoutes: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${APP_URL}/${locale}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 1,
    alternates: {
      languages: {
        en: `${APP_URL}/en`,
        es: `${APP_URL}/es`,
      },
    },
  }));

  // Profession routes with localized slugs and alternates
  const professionRoutes: MetadataRoute.Sitemap = dataset.professions.flatMap((profession) => {
    const enUrl = `${APP_URL}/en/p/${profession.slug.en}`;
    const esUrl = `${APP_URL}/es/p/${profession.slug.es}`;

    return [
      {
        url: enUrl,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates: {
          languages: {
            en: enUrl,
            es: esUrl,
          },
        },
      },
      {
        url: esUrl,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates: {
          languages: {
            en: enUrl,
            es: esUrl,
          },
        },
      },
    ];
  });

  return [...baseRoutes, ...professionRoutes];
}
