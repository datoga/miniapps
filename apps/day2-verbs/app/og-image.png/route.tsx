import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "Verb Master Pro",
    tagline: "Master English irregular verbs",
    icon: "🇬🇧",
    features: ["100% Free", "Works Offline", "Track Progress"],
    gradientColors: ["#4f46e5", "#7c3aed"],
  });
}
