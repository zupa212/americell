import type { ReactElement } from "react";

// Shared visual for the Open Graph + Twitter images. Route-segment config
// (runtime/alt/size/contentType) must live inline in each route file so Next
// can statically parse it — only this presentational element is shared.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_ALT = "Americell — real US phones, controlled from anywhere";

export function OgCard(): ReactElement {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        backgroundImage:
          "radial-gradient(circle at 85% 15%, rgba(37, 99, 235, 0.18), transparent 45%), radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.12), transparent 40%)",
        padding: "96px",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "120px",
          height: "12px",
          borderRadius: "9999px",
          marginBottom: "40px",
          backgroundImage: "linear-gradient(90deg, #2563eb, #60a5fa)",
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: "128px",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "#0f172a",
        }}
      >
        Americell
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "32px",
          fontSize: "48px",
          fontWeight: 500,
          lineHeight: 1.15,
          color: "#334155",
          maxWidth: "900px",
        }}
      >
        Real US phones, controlled from anywhere
      </div>
    </div>
  );
}
