import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Game Master",
    short_name: "GameMaster",
    description: "Organize gaming tournaments with elimination brackets and rankings",
    start_url: "/?utm_source=pwa&utm_medium=installed",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#22c55e",
    orientation: "portrait",
    categories: ["games", "entertainment"],
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
