import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Verb Master Pro - English Irregular Verbs",
    short_name: "Verb Master",
    description:
      "Learn and practice English irregular verbs with an interactive app. Listen to pronunciations, take quizzes, exams and track your progress. 100% free.",
    start_url: "/?utm_source=pwa&utm_medium=installed",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    orientation: "portrait",
    categories: ["education", "reference", "productivity"],
    prefer_related_applications: false,
    lang: "en",
    dir: "ltr",
    icons: [
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
  };
}
