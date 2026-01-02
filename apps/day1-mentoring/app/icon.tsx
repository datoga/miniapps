import { ImageResponse } from "next/og";

// Icon configuration
const APP_EMOJI = "👥";

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

// Generate the icon image
export default function Icon({ id }: { id: string }) {
  const size = SIZES[id] ?? 512;
  const fontSize = Math.round(size * 0.75);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
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
    {
      width: size,
      height: size,
    }
  );
}
