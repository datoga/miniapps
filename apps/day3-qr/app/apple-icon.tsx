import { ImageResponse } from "next/og";

// Icon configuration (same as icon.tsx)
const BG_COLOR = "#0ea5e9";

// Apple touch icon is always 180x180
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const iconSize = 180;
  const borderRadius = Math.round(iconSize * 0.18);
  const fontSize = Math.round(iconSize * 0.5);

  return new ImageResponse(
    (
      <div
        style={{
          width: iconSize,
          height: iconSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BG_COLOR,
          borderRadius,
          color: "white",
          fontSize,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        QR
      </div>
    ),
    { width: iconSize, height: iconSize }
  );
}
