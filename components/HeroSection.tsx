"use client";

import AnimatedNumber from "./AnimatedNumber";
import { ff, sans, mono } from "@/lib/constants";

export default function HeroSection({
  gaza,
  onShare,
}: {
  gaza: {
    last_update?: string;
    killed?: { total?: number; children?: number; women?: number };
  };
  onShare: () => void;
}) {
  const g = gaza;
  return (
    <section
      id="hero"
      style={{
        minHeight: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "4rem 2rem 6rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 15% 50%, rgba(220,38,38,0.05) 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(220,38,38,0.03) 0%, transparent 50%)",
        }}
      />
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "2.5rem",
            animation: "fadeUp 0.8s ease-out",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#dc2626",
              animation: "pulse 2s infinite",
            }}
          />
          <span
            style={{
              fontFamily: mono,
              fontSize: "0.7rem",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#dc2626",
            }}
          >
            Live data &middot; Updated {g.last_update}
          </span>
        </div>

        <h1
          style={{
            fontFamily: ff,
            fontSize: "clamp(3rem, 8vw, 6.5rem)",
            fontWeight: 900,
            lineHeight: 1.0,
            marginBottom: "1.5rem",
            animation: "fadeUp 0.8s ease-out 0.1s both",
          }}
        >
          <span style={{ color: "#dc2626" }}>
            <AnimatedNumber value={g.killed?.total || 0} />
          </span>
        </h1>
        <p
          style={{
            fontFamily: ff,
            fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
            fontWeight: 400,
            color: "#737373",
            marginBottom: "2rem",
            animation: "fadeUp 0.8s ease-out 0.15s both",
          }}
        >
          lives taken in Gaza since October 2023
        </p>

        <p
          style={{
            fontFamily: sans,
            fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
            color: "#a3a3a3",
            lineHeight: 1.8,
            maxWidth: "580px",
            marginBottom: "3rem",
            animation: "fadeUp 0.8s ease-out 0.2s both",
          }}
        >
          Including{" "}
          <strong style={{ color: "#e5e5e5" }}>
            {(g.killed?.children || 0).toLocaleString()} children
          </strong>{" "}
          and{" "}
          <strong style={{ color: "#e5e5e5" }}>
            {(g.killed?.women || 0).toLocaleString()} women
          </strong>
          . Each one had a name, a family, a future. This page uses live,
          open-source data to show the scale &mdash; and what you can do right
          now.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            animation: "fadeUp 0.8s ease-out 0.3s both",
          }}
        >
          <a href="#act" className="btn-primary">
            Take Action &darr;
          </a>
          <a href="#data" className="btn-secondary">
            See the Data &darr;
          </a>
          <button className="btn-secondary" onClick={onShare}>
            Share This Page
          </button>
        </div>
      </div>
    </section>
  );
}
