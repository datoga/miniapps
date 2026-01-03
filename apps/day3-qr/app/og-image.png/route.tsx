import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "QRKit Way",
    tagline: "Your personal QR code library",
    icon: "📱",
    features: ["Create", "Scan", "Organize"],
    gradientColors: ["#0ea5e9", "#0284c7"],
  });
}
