import { ImageResponse } from "next/og";

// Icon colors - Red theme for recording
const BG_COLOR = "#dc2626"; // Red-600
const ICON_COLOR = "#ffffff"; // White

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

// Camera/Record icon component
function RecordIcon({ iconSize }: { iconSize: number }) {
  const scale = iconSize / 100;
  const px = (n: number) => n * scale;

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: iconSize,
        height: iconSize,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Camera body */}
      <div
        style={{
          position: "absolute",
          width: px(60),
          height: px(45),
          backgroundColor: ICON_COLOR,
          borderRadius: px(8),
          left: px(15),
          top: px(30),
        }}
      />
      {/* Camera lens bump */}
      <div
        style={{
          position: "absolute",
          width: px(15),
          height: px(35),
          backgroundColor: ICON_COLOR,
          borderRadius: `0 ${px(8)}px ${px(8)}px 0`,
          left: px(75),
          top: px(35),
        }}
      />
      {/* Lens circle */}
      <div
        style={{
          position: "absolute",
          width: px(25),
          height: px(25),
          backgroundColor: BG_COLOR,
          borderRadius: "50%",
          left: px(32),
          top: px(40),
          border: `${px(3)}px solid ${ICON_COLOR}`,
        }}
      />
      {/* REC dot */}
      <div
        style={{
          position: "absolute",
          width: px(12),
          height: px(12),
          backgroundColor: "#ffffff",
          borderRadius: "50%",
          right: px(22),
          top: px(22),
          boxShadow: `0 0 ${px(4)}px rgba(255,255,255,0.8)`,
        }}
      />
    </div>
  );
}

export default function AppleIcon() {
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
        <RecordIcon iconSize={size.width * 0.9} />
      </div>
    ),
    {
      ...size,
    }
  );
}
