import type { ImageResponse } from "next/og";
import { generateOgImage } from "@miniapps/seo";

export const runtime = "edge";

export async function GET(): Promise<ImageResponse> {
  return generateOgImage({
    appName: "CareerBoard",
    tagline: "Land your dream job with visual tracking",
    icon: "💼",
    features: ["Free", "Private", "Kanban View"],
    gradientColors: ["#8b5cf6", "#7c3aed"],
  });
}
