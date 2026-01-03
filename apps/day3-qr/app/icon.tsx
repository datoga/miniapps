import { ImageResponse } from "next/og";

// Icon configuration
const BG_COLOR = "#0ea5e9";

// Generate multiple icon sizes
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 } },
    { id: "192", size: { width: 192, height: 192 } },
    { id: "512", size: { width: 512, height: 512 } },
  ];
}

// Size lookup map
const SIZES: Record<string, number> = {
  "32": 32,
  "192": 192,
  "512": 512,
};

// Generate the icon image with QR code style
export default function Icon({ id }: { id: string }) {
  const size = SIZES[id] ?? 512;
  const borderRadius = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.5);

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
    {
      width: size,
      height: size,
    }
  );
}
