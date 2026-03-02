"use client";

import dynamic from "next/dynamic";

const PageContent = dynamic(() => import("@/components/PageContent"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0a0a0a",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#dc2626",
            margin: "0 auto 1.5rem",
            animation: "pulse 1.5s infinite",
          }}
        />
        <p
          style={{
            color: "#525252",
            fontSize: "0.82rem",
            letterSpacing: "0.05em",
          }}
        >
          Loading&hellip;
        </p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <PageContent />;
}
