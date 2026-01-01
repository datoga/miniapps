import { ImageResponse } from "next/og";

// Icon configuration
const APP_INITIALS = "VM";
const BG_COLOR = "#10b981";
const TEXT_COLOR = "#ffffff";

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
  const fontSize = Math.round(size * 0.4);
  const borderRadius = Math.round(size * 0.18);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
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
    {
      width: size,
      height: size,
    }
  );
}

