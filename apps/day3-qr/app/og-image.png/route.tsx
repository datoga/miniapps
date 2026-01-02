import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "QuickQR",
    tagline: "Generate stunning QR codes in seconds",
    icon: "📱",
    features: ["Free", "Private", "Instant"],
    gradientColors: ["#3b82f6", "#1d4ed8"],
  });
}
