import { ImageResponse } from "next/og";

// Same configuration as icon.tsx for consistency
const BG_GRADIENT_START = "#10b981"; // Emerald
const BG_GRADIENT_END = "#6366f1"; // Indigo

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${BG_GRADIENT_START} 0%, ${BG_GRADIENT_END} 100%)`,
          borderRadius: 40,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 80,
          color: "white",
          letterSpacing: "-0.02em",
          textShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        AI
      </div>
    ),
    {
      ...size,
    }
  );
}
