import { ImageResponse } from "next/og";

export const alt = "FREELONS — 404 HEX NOT FOUND";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0e0c0a",
          backgroundImage:
            "radial-gradient(ellipse 70% 40% at 30% 10%, rgba(74,45,117,0.35), transparent 60%), radial-gradient(ellipse 50% 30% at 80% 90%, rgba(184,82,58,0.18), transparent 60%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          fontFamily: "Bebas Neue, sans-serif",
          color: "#d4c69d",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 8, color: "#c9a02d", marginBottom: 16 }}>
          FILE FHD-1986-X · CLEARANCE: BLUE
        </div>
        <div style={{ fontSize: 220, lineHeight: 0.85, letterSpacing: -8 }}>
          404 HEX
        </div>
        <div style={{ fontSize: 220, lineHeight: 0.85, letterSpacing: -8, color: "#8b5cf6", marginLeft: 80 }}>
          NOT FOUND.
        </div>
        <div style={{ fontSize: 28, letterSpacing: 6, marginTop: 30, color: "#d4c69d", opacity: 0.8 }}>
          BRING BACK THE HEX ON X
        </div>
      </div>
    ),
    size
  );
}
