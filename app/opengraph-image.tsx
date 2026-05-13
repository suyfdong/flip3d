import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Flip3D — Free 3D File Converter, Viewer & Repair Tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #0e7490 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top row: logo + brand name */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 18,
              background: "linear-gradient(135deg, #3b82f6, #22d3ee)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 52,
              fontWeight: 700,
              boxShadow: "0 4px 24px rgba(34,211,238,0.35)",
            }}
          >
            F
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
            Flip3D
          </div>
        </div>

        {/* Middle: big headline + format strip */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            <div>Free 3D File Converter,</div>
            <div>Viewer &amp; Repair Tools</div>
          </div>
          <div
            style={{
              fontSize: 28,
              opacity: 0.88,
              fontWeight: 500,
              letterSpacing: -0.3,
            }}
          >
            STL · OBJ · GLB · 3MF · PLY · STEP · IGES · FBX · DAE
          </div>
        </div>

        {/* Bottom row: tagline + URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 26,
          }}
        >
          <div style={{ opacity: 0.85, fontWeight: 500 }}>
            No signup · No upload · 100% in your browser
          </div>
          <div
            style={{
              fontWeight: 700,
              color: "#22d3ee",
              letterSpacing: 0.5,
            }}
          >
            flip3d.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
