import { ImageResponse } from "next/og";

// Icon configuration - ReplacedByAI
const BG_GRADIENT_START = "#10b981"; // Emerald
const BG_GRADIENT_END = "#6366f1"; // Indigo

// Generate multiple icon sizes
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 } },
    { id: "192", size: { width: 192, height: 192 } },
    { id: "512", size: { width: 512, height: 512 } },
  ];
}

// Generate the icon image
export default function Icon({ id }: { id: string }) {
  const size = id === "32" ? 32 : id === "192" ? 192 : 512;
  const fontSize = Math.round(size * 0.45);
  const borderRadius = Math.round(size * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${BG_GRADIENT_START} 0%, ${BG_GRADIENT_END} 100%)`,
          borderRadius: borderRadius,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 900,
          fontSize: fontSize,
          color: "white",
          letterSpacing: "-0.02em",
          textShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        AI
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
