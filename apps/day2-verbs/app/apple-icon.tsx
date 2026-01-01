import { ImageResponse } from "next/og";

// Icon configuration (same as icon.tsx for consistency)
const APP_INITIALS = "D2";
const BG_COLOR = "#10b981";
const TEXT_COLOR = "#ffffff";

// Apple touch icon is always 180x180
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const fontSize = Math.round(180 * 0.4);
  const borderRadius = Math.round(180 * 0.18);

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BG_COLOR,
          borderRadius: borderRadius,
          color: TEXT_COLOR,
          fontSize: fontSize,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {APP_INITIALS}
      </div>
    ),
    { width: 180, height: 180 }
  );
}

