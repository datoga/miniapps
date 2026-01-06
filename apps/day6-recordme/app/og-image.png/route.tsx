import { ImageResponse } from "next/og";

export const runtime = "edge";

const APP_NAME = "record.me";
const TAGLINE = "Record webcam videos directly to disk";
const FEATURES = ["No cloud", "No registration", "Large recordings"];
const BG_COLOR = "#dc2626";
const ACCENT_COLOR = "#ffffff";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${BG_COLOR} 0%, #b91c1c 100%)`,
          padding: 60,
        }}
      >
        {/* App icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              backgroundColor: ACCENT_COLOR,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 50,
            }}
          >
            🎥
          </div>
        </div>

        {/* App name */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: ACCENT_COLOR,
            margin: 0,
            marginBottom: 15,
            textAlign: "center",
          }}
        >
          {APP_NAME}
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: 32,
            color: "rgba(255, 255, 255, 0.9)",
            margin: 0,
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          {TAGLINE}
        </p>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 20,
          }}
        >
          {FEATURES.map((feature) => (
            <div
              key={feature}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 30,
                padding: "12px 24px",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  color: ACCENT_COLOR,
                  fontWeight: 600,
                }}
              >
                ✓ {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
