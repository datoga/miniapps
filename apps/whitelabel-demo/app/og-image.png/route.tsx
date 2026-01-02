import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "MiniApp Studio",
    tagline: "Your toolkit for building beautiful mini apps",
    icon: "🚀",
    features: ["Free", "PWA Ready", "SEO Optimized"],
    gradientColors: ["#0ea5e9", "#6366f1"],
  });
}
