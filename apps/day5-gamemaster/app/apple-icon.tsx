import { ImageResponse } from "next/og";

// Apple icon - same as regular icon but with specific size
const BG_COLOR = "#0f172a"; // Slate-900 (dark arcade screen)
const ALIEN_COLOR = "#22c55e"; // Green-500 (classic arcade green)

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Space Invader / Alien icon component
function AlienIcon({ size: iconSize }: { size: number }) {
  const scale = iconSize / 100;
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
        width: iconSize,
        height: iconSize,
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

export default function AppleIcon() {
  const iconSize = size.width;
  const borderRadius = Math.round(iconSize * 0.22);

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
        }}
      >
        <AlienIcon size={iconSize * 0.9} />
      </div>
    ),
    {
      ...size,
    }
  );
}
