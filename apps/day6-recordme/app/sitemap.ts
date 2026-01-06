import { generateSitemap } from "@miniapps/seo";
import type { MetadataRoute } from "next";

const APP_URL = "https://recordme.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return generateSitemap({
    appUrl: APP_URL,
    routes: [
      { path: "", priority: 1, changeFrequency: "weekly" },
    ],
  });
}
