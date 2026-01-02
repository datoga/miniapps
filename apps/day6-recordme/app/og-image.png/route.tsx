import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "VoiceSnap",
    tagline: "Capture your voice, preserve your thoughts",
    icon: "🎙️",
    features: ["Free", "Private", "Offline"],
    gradientColors: ["#f97316", "#ea580c"],
  });
}
