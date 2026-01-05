import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "Game Master",
    tagline: "Organize gaming tournaments like a pro",
    icon: "👾",
    features: ["Brackets", "Rankings", "TV Mode", "Free"],
    gradientColors: ["#0f172a", "#1e3a5f"],
  });
}
