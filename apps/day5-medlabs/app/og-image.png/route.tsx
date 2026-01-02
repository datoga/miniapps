import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "LabTracker",
    tagline: "Track your medical results with ease",
    icon: "🔬",
    features: ["Private", "Free", "Visual Trends"],
    gradientColors: ["#06b6d4", "#0891b2"],
  });
}
