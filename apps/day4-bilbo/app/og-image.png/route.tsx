import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "Bilbo Explorer",
    tagline: "Discover the magic of Bilbao city",
    icon: "🏛️",
    features: ["Free", "Offline", "Local Tips"],
    gradientColors: ["#ef4444", "#dc2626"],
  });
}
