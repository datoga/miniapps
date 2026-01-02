import { ImageResponse } from "next/og";

// Apple icon - needs solid background for iOS
const ICON_EMOJI = "🇬🇧";
const BG_COLOR = "#4f46e5";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  const fontSize = Math.round(size.width * 0.55);

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BG_COLOR,
          fontSize,
        }}
      >
        {ICON_EMOJI}
      </div>
    ),
    {
      ...size,
    }
  );
}
