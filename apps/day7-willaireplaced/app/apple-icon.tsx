import { ImageResponse } from "next/og";

// Same configuration as icon.tsx for consistency
const APP_ICON = "🔮";
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
          borderRadius: 32,
          fontSize: 108,
        }}
      >
        {APP_ICON}
      </div>
    ),
    {
      ...size,
    }
  );
}


