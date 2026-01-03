import { ImageResponse } from "next/og";

// Icon configuration (same as icon.tsx)
const BG_COLOR = "#0ea5e9";

// Apple touch icon is always 180x180
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const iconSize = 180;
  const borderRadius = Math.round(iconSize * 0.18);
  const unit = Math.round(iconSize / 8);
  const smallUnit = Math.round(iconSize / 16);

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
          padding: unit,
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
                width: unit * 2.5,
                height: unit * 2.5,
                backgroundColor: "white",
                borderRadius: smallUnit / 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: unit * 1.2,
                  height: unit * 1.2,
                  backgroundColor: BG_COLOR,
                  borderRadius: smallUnit / 3,
                }}
              />
            </div>
            {/* Top middle */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: smallUnit, height: smallUnit, backgroundColor: "white", borderRadius: 2 }} />
            </div>
            {/* Top-right finder pattern */}
            <div
              style={{
                width: unit * 2.5,
                height: unit * 2.5,
                backgroundColor: "white",
                borderRadius: smallUnit / 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: unit * 1.2,
                  height: unit * 1.2,
                  backgroundColor: BG_COLOR,
                  borderRadius: smallUnit / 3,
                }}
              />
            </div>
          </div>
          {/* Middle row */}
          <div style={{ display: "flex", gap: smallUnit, flex: 1, alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: smallUnit, height: smallUnit, backgroundColor: "white", borderRadius: 2 }} />
            <div style={{ width: smallUnit * 1.5, height: smallUnit * 1.5, backgroundColor: "white", borderRadius: 2 }} />
            <div style={{ width: smallUnit, height: smallUnit, backgroundColor: "white", borderRadius: 2 }} />
          </div>
          {/* Bottom row */}
          <div style={{ display: "flex", gap: smallUnit, flex: 1 }}>
            {/* Bottom-left finder pattern */}
            <div
              style={{
                width: unit * 2.5,
                height: unit * 2.5,
                backgroundColor: "white",
                borderRadius: smallUnit / 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: unit * 1.2,
                  height: unit * 1.2,
                  backgroundColor: BG_COLOR,
                  borderRadius: smallUnit / 3,
                }}
              />
            </div>
            {/* Bottom middle + right */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: smallUnit }}>
              <div style={{ width: smallUnit, height: smallUnit, backgroundColor: "white", borderRadius: 2 }} />
              <div style={{ width: smallUnit * 1.5, height: smallUnit * 1.5, backgroundColor: "white", borderRadius: 2 }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { width: iconSize, height: iconSize }
  );
}
