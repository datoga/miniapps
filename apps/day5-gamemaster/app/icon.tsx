import { ImageResponse } from "next/og";

// Icon colors - Retro arcade green theme
const BG_COLOR = "#0f172a"; // Slate-900 (dark arcade screen)
const ALIEN_COLOR = "#22c55e"; // Green-500 (classic arcade green)

// Generate multiple icon sizes
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 } },
    { id: "192", size: { width: 192, height: 192 } },
    { id: "512", size: { width: 512, height: 512 } },
  ];
}

// Space Invader / Alien icon component
function AlienIcon({ size }: { size: number }) {
  const scale = size / 100;
  const px = (n: number) => n * scale;

  // Pixel grid for a classic space invader (11x8)
  const pixels = [
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
  ];

  const pixelSize = px(8);
  const startX = px(6);
  const startY = px(18);

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: size,
        height: size,
      }}
    >
      {pixels.map((row, y) =>
        row.map((pixel, x) =>
          pixel === 1 ? (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: startX + x * pixelSize,
                top: startY + y * pixelSize,
                width: pixelSize,
                height: pixelSize,
                backgroundColor: ALIEN_COLOR,
                boxShadow: `0 0 ${px(4)}px ${ALIEN_COLOR}`,
              }}
            />
          ) : null
        )
      )}
    </div>
  );
}

// Get size from id
function getSizeFromId(id: string): number {
  if (id === "32") return 32;
  if (id === "192") return 192;
  return 512;
}

// Generate the icon image
export default function Icon({ id }: { id: string }) {
  const size = getSizeFromId(id);
  const borderRadius = Math.round(size * 0.22);

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
        }}
      >
        <AlienIcon size={size * 0.9} />
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
