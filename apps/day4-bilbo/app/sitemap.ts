import type { MetadataRoute } from "next";
import { generateSitemap } from "@miniapps/seo";

const APP_URL = "https://bilbo-explorer.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return generateSitemap({
    appUrl: APP_URL,
    routes: [{ path: "", priority: 1, changeFrequency: "weekly" }],
  });
}
