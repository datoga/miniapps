import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Replaced by AI? — Task-Level Job Analysis",
    short_name: "ReplacedByAI",
    description:
      "Discover how AI will transform your job task by task. Analyze 100+ professions with automation levels and timelines. Free tool.",
    start_url: "/?utm_source=pwa&utm_medium=installed",
    scope: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#10b981",
    orientation: "portrait",
    categories: ["education", "productivity", "utilities"],
    prefer_related_applications: false,
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon/32",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/og-image.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
        label: "ReplacedByAI - Task-level AI job analysis",
      },
    ],
  };
}
