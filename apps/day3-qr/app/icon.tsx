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

// Generate the icon image with QR code pattern style
export default function Icon({ id }: { id: string }) {
  const size = SIZES[id] ?? 512;
  const borderRadius = Math.round(size * 0.18);
  const padding = Math.round(size * 0.15); // More padding to avoid cut-off
  const unit = Math.round(size / 10); // Smaller units
  const smallUnit = Math.round(size / 20);

  return new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BG_COLOR,
        borderRadius,
        padding,
      }}
    >
      {/* QR-style pattern */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: smallUnit,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", gap: smallUnit, flex: 1 }}>
          {/* Top-left finder pattern */}
          <div
            style={{
              width: unit * 2,
              height: unit * 2,
              backgroundColor: "white",
              borderRadius: smallUnit / 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: unit,
                height: unit,
                backgroundColor: BG_COLOR,
                borderRadius: smallUnit / 3,
              }}
            />
          </div>
          {/* Top middle */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                width: smallUnit,
                height: smallUnit,
                backgroundColor: "white",
                borderRadius: 2,
              }}
            />
          </div>
          {/* Top-right finder pattern */}
          <div
            style={{
              width: unit * 2,
              height: unit * 2,
              backgroundColor: "white",
              borderRadius: smallUnit / 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: unit,
                height: unit,
                backgroundColor: BG_COLOR,
                borderRadius: smallUnit / 3,
              }}
            />
          </div>
        </div>
        {/* Middle row */}
        <div
          style={{
            display: "flex",
            gap: smallUnit,
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: smallUnit,
              height: smallUnit,
              backgroundColor: "white",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: smallUnit * 1.5,
              height: smallUnit * 1.5,
              backgroundColor: "white",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: smallUnit,
              height: smallUnit,
              backgroundColor: "white",
              borderRadius: 2,
            }}
          />
        </div>
        {/* Bottom row */}
        <div style={{ display: "flex", gap: smallUnit, flex: 1 }}>
          {/* Bottom-left finder pattern */}
          <div
            style={{
              width: unit * 2,
              height: unit * 2,
              backgroundColor: "white",
              borderRadius: smallUnit / 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: unit,
                height: unit,
                backgroundColor: BG_COLOR,
                borderRadius: smallUnit / 3,
              }}
            />
          </div>
          {/* Bottom middle + right */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: smallUnit,
            }}
          >
            <div
              style={{
                width: smallUnit,
                height: smallUnit,
                backgroundColor: "white",
                borderRadius: 2,
              }}
            />
            <div
              style={{
                width: smallUnit * 1.5,
                height: smallUnit * 1.5,
                backgroundColor: "white",
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    {
      width: size,
      height: size,
    }
  );
}
