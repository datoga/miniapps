import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "Replaced by AI?",
    tagline: "Yes, but not yet",
    icon: "🔮",
    features: ["100+ Professions", "Task Analysis", "Free Tool"],
    gradientColors: ["#10b981", "#6366f1"],
  });
}
