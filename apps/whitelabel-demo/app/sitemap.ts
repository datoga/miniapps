import type { MetadataRoute } from "next";
import { generateSitemap } from "@miniapps/seo";

const APP_URL = "https://miniapp-studio.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return generateSitemap({
    appUrl: APP_URL,
    routes: [
      { path: "", priority: 1, changeFrequency: "weekly" },
      { path: "/get-started", priority: 0.8, changeFrequency: "monthly" },
      { path: "/learn-more", priority: 0.8, changeFrequency: "monthly" },
      { path: "/docs", priority: 0.7, changeFrequency: "monthly" },
    ],
  });
}
