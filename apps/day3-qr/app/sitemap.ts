import type { MetadataRoute } from "next";
import { generateSitemap } from "@miniapps/seo";
import { APP_URL } from "../lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return generateSitemap({
    appUrl: APP_URL,
    routes: [{ path: "", priority: 1, changeFrequency: "weekly" }],
  });
}
