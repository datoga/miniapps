import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LabTracker",
    short_name: "LabTracker",
    description: "Track your medical results with ease",
    start_url: "/?utm_source=pwa&utm_medium=installed",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#06b6d4",
    orientation: "portrait",
    categories: ["medical", "health"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon?id=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon?id=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon?id=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon?id=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

