import { generateOgImage } from "@miniapps/seo";
import type { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "QRKit",
    tagline: "Your personal QR code library",
    icon: "📱",
    features: ["Create", "Scan", "Organize"],
    gradientColors: ["#0ea5e9", "#0284c7"],
  });
}
