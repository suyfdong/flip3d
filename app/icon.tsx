import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b82f6, #22d3ee)",
          color: "#ffffff",
          fontSize: 44,
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, sans-serif",
          borderRadius: 12,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
