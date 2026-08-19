import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 38,
        background: "linear-gradient(145deg, #2d1916, #140a09)",
      }}
    >
      <div
        style={{
          width: 118,
          height: 118,
          display: "flex",
          overflow: "hidden",
          border: "5px solid #e8d8b9",
          borderRadius: 999,
          boxShadow: "0 8px 24px rgba(0,0,0,0.38)",
        }}
      >
        <div style={{ width: "50%", height: "100%", background: "#2c7fa7" }} />
        <div style={{ width: "50%", height: "100%", background: "#a54146" }} />
      </div>
    </div>,
    size,
  );
}
