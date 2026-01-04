import { ImageResponse } from "next/og";

// Icon colors - match main icon
const BG_COLOR = "#dc2626"; // Red-600
const EQUIPMENT_COLOR = "#ffffff";
const ACCENT_COLOR = "#fef2f2"; // Red-50 for plates

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Bench Press icon component - side view
function BenchPressIcon({ iconSize }: { iconSize: number }) {
  const scale = iconSize / 100;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: iconSize,
        height: iconSize,
      }}
    >
      {/* Bench base/legs */}
      <div
        style={{
          position: "absolute",
          bottom: 18 * scale,
          left: 20 * scale,
          width: 8 * scale,
          height: 20 * scale,
          backgroundColor: EQUIPMENT_COLOR,
          borderRadius: 2 * scale,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 18 * scale,
          right: 25 * scale,
          width: 8 * scale,
          height: 20 * scale,
          backgroundColor: EQUIPMENT_COLOR,
          borderRadius: 2 * scale,
        }}
      />

      {/* Bench pad (horizontal) */}
      <div
        style={{
          position: "absolute",
          bottom: 36 * scale,
          left: 15 * scale,
          width: 55 * scale,
          height: 10 * scale,
          backgroundColor: EQUIPMENT_COLOR,
          borderRadius: 3 * scale,
        }}
      />

      {/* Rack uprights */}
      <div
        style={{
          position: "absolute",
          bottom: 18 * scale,
          right: 12 * scale,
          width: 6 * scale,
          height: 50 * scale,
          backgroundColor: EQUIPMENT_COLOR,
          borderRadius: 2 * scale,
        }}
      />

      {/* J-hooks */}
      <div
        style={{
          position: "absolute",
          bottom: 58 * scale,
          right: 12 * scale,
          width: 12 * scale,
          height: 5 * scale,
          backgroundColor: EQUIPMENT_COLOR,
          borderRadius: 2 * scale,
        }}
      />

      {/* Barbell */}
      <div
        style={{
          position: "absolute",
          bottom: 62 * scale,
          left: 8 * scale,
          width: 84 * scale,
          height: 5 * scale,
          backgroundColor: EQUIPMENT_COLOR,
          borderRadius: 3 * scale,
        }}
      />

      {/* Left plate (outer - big) */}
      <div
        style={{
          position: "absolute",
          bottom: 52 * scale,
          left: 5 * scale,
          width: 8 * scale,
          height: 26 * scale,
          backgroundColor: ACCENT_COLOR,
          borderRadius: 2 * scale,
        }}
      />

      {/* Left plate (inner - smaller) */}
      <div
        style={{
          position: "absolute",
          bottom: 55 * scale,
          left: 13 * scale,
          width: 6 * scale,
          height: 20 * scale,
          backgroundColor: ACCENT_COLOR,
          borderRadius: 2 * scale,
        }}
      />

      {/* Right plate (outer - big) */}
      <div
        style={{
          position: "absolute",
          bottom: 52 * scale,
          right: 5 * scale,
          width: 8 * scale,
          height: 26 * scale,
          backgroundColor: ACCENT_COLOR,
          borderRadius: 2 * scale,
        }}
      />

      {/* Right plate (inner - smaller) */}
      <div
        style={{
          position: "absolute",
          bottom: 55 * scale,
          right: 13 * scale,
          width: 6 * scale,
          height: 20 * scale,
          backgroundColor: ACCENT_COLOR,
          borderRadius: 2 * scale,
        }}
      />
    </div>
  );
}

export default function Icon() {
  const borderRadius = Math.round(size.width * 0.22);

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
          borderRadius,
        }}
      >
        <BenchPressIcon iconSize={size.width * 0.85} />
      </div>
    ),
    {
      ...size,
    }
  );
}
