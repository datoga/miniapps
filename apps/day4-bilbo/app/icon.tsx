import { ImageResponse } from "next/og";

// Icon colors
const BG_COLOR = "#dc2626"; // Red-600
const EQUIPMENT_COLOR = "#ffffff";
const ACCENT_COLOR = "#fef2f2"; // Red-50 for plates

// Generate multiple icon sizes
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 } },
    { id: "192", size: { width: 192, height: 192 } },
    { id: "512", size: { width: 512, height: 512 } },
  ];
}

// Bench Press icon component - side view
function BenchPressIcon({ size }: { size: number }) {
  const scale = size / 100;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: size,
        height: size,
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

// Get size from id
function getSizeFromId(id: string): number {
  if (id === "32") {return 32;}
  if (id === "192") {return 192;}
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
        <BenchPressIcon size={size * 0.85} />
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
