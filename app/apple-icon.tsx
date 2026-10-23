import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 44,
          background: "#193d2d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 64 64" fill="none">
          <path d="M32 55V31" stroke="#e9f1df" strokeWidth="4" strokeLinecap="round" />
          <path d="M31 36C20 36 16 29 17 20c9-1 16 4 16 13" fill="#c2d7b1" />
          <path d="M33 32c0-10 6-16 15-17 1 9-3 17-15 19" fill="#91b37c" />
          <path d="M32 54c-1-6-5-10-11-12" stroke="#e9f1df" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
