import { ImageResponse } from "next/og";

// Icon with transparent background - English verbs theme
const ICON_EMOJI = "🇬🇧";

export const contentType = "image/png";

// Generate multiple icon sizes
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

// Size mapping to avoid nested ternary
const sizeMap: Record<string, number> = {
  "32": 32,
  "192": 192,
  "512": 512,
};

// Generate the icon image
export default function Icon({ id }: { id: string }) {
  const size = sizeMap[id] ?? 512;
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
          fontSize,
        }}
      >
        {ICON_EMOJI}
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
