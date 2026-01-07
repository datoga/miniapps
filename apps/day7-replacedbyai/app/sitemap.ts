import type { MetadataRoute } from "next";
import { getDataset } from "@/lib/professions/load.server";

const APP_URL = "https://replacedbyai.guru";

export default function sitemap(): MetadataRoute.Sitemap {
  const dataset = getDataset();
  const now = new Date();

  // Base routes for each locale with alternates (including x-default)
  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: `${APP_URL}/en`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
      alternates: {
        languages: {
          en: `${APP_URL}/en`,
          es: `${APP_URL}/es`,
          "x-default": `${APP_URL}/en`,
        },
      },
    },
    {
      url: `${APP_URL}/es`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
      alternates: {
        languages: {
          en: `${APP_URL}/en`,
          es: `${APP_URL}/es`,
          "x-default": `${APP_URL}/en`,
        },
      },
    },
  ];

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
            "x-default": enUrl,
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
            "x-default": enUrl,
          },
        },
      },
    ];
  });

  return [...baseRoutes, ...professionRoutes];
}
