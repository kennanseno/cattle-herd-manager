import { ImageResponse } from "next/og";

export const alt =
  "Cattle Herd Manager — thoughtful tools for better herd care";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          color: "#f5f5ed",
          background:
            "radial-gradient(circle at 84% 18%, #456a48 0, transparent 34%), linear-gradient(135deg, #142d22 0%, #193d2d 58%, #284a32 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#c2d7b1",
            }}
          >
            <svg width="42" height="42" viewBox="0 0 64 64" fill="none">
              <path d="M32 53V30" stroke="#193d2d" strokeWidth="5" strokeLinecap="round" />
              <path d="M31 35C20 35 16 28 17 19c9-1 16 4 16 13" fill="#315c3c" />
              <path d="M33 31c0-10 6-16 15-17 1 9-3 17-15 19" fill="#638858" />
              <path d="M32 52c-1-6-5-10-11-12" stroke="#193d2d" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em" }}>
            Cattle Herd Manager
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              color: "#c2d7b1",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            A steadier view of farm life
          </div>
          <div
            style={{
              maxWidth: 940,
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.055em",
              lineHeight: 1.08,
            }}
          >
            Good records.
            <br />
            Better herd care.
          </div>
          <div style={{ color: "#d7e0d1", fontSize: 27, lineHeight: 1.4 }}>
            Cattle, breeding, health, and farm finances in one thoughtful workspace.
          </div>
        </div>
        <div style={{ color: "#c2d7b1", fontSize: 20, fontWeight: 500 }}>
          Thoughtful tools for cattle and farm management
        </div>
      </div>
    ),
    size,
  );
}
