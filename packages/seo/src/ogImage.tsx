import { ImageResponse } from "next/og";

export interface OgImageConfig {
  /** App name displayed prominently */
  appName: string;
  /** Tagline/description shown below the name */
  tagline: string;
  /** Emoji or icon to display (default: "🚀") */
  icon?: string;
  /** Feature highlights to show at the bottom (max 3 recommended) */
  features?: string[];
  /** Gradient colors [from, to] (default: purple gradient) */
  gradientColors?: [string, string];
  /** Width of the image (default: 1200) */
  width?: number;
  /** Height of the image (default: 630) */
  height?: number;
}

/**
 * Generates an OG image using Next.js ImageResponse.
 * Use this in an og-image.png/route.tsx file.
 *
 * @example
 * ```tsx
 * // app/og-image.png/route.tsx
 * import { generateOgImage } from "@miniapps/seo";
 *
 * export const runtime = "edge";
 *
 * export async function GET() {
 *   return generateOgImage({
 *     appName: "MyApp",
 *     tagline: "Build amazing things",
 *     icon: "✨",
 *     features: ["Free", "Open Source", "Fast"],
 *   });
 * }
 * ```
 */
export function generateOgImage(config: OgImageConfig): ImageResponse {
  const {
    appName,
    tagline,
    icon = "🚀",
    features = [],
    gradientColors = ["#667eea", "#764ba2"],
    width = 1200,
    height = 630,
  } = config;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Icon container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 50,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            {icon}
          </div>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            marginBottom: 16,
            textShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          {appName}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          {tagline}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.7)",
              marginTop: 24,
              display: "flex",
              gap: 32,
            }}
          >
            {features.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>
        )}
      </div>
    ),
    {
      width,
      height,
    }
  );
}

