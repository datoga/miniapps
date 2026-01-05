import { generateSitemap } from "@miniapps/seo";
import type { MetadataRoute } from "next";

const APP_URL = "https://mentorflow.space";

export default function sitemap(): MetadataRoute.Sitemap {
  return generateSitemap({
    appUrl: APP_URL,
    locales: ["es", "en"],
    routes: [
      { path: "", priority: 1, changeFrequency: "weekly" },
      { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    ],
  });
}
