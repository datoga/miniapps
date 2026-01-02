import { ImageResponse } from "next/og";

// Icon configuration (same as icon.tsx for consistency)
const APP_EMOJI = "👥";

// Apple touch icon is always 180x180
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const fontSize = Math.round(180 * 0.75);

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
          fontSize,
        }}
      >
        {APP_EMOJI}
      </div>
    ),
    { width: 180, height: 180 }
  );
}
