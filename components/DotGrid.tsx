"use client";

import { sans } from "@/lib/constants";

export default function DotGrid({
  count,
  label,
  color = "#dc2626",
  maxDots = 200,
}: {
  count: number;
  label: string;
  color?: string;
  maxDots?: number;
}) {
  const capped = Math.min(count, maxDots);
  const scale = count / capped;
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "3px",
          marginBottom: "0.5rem",
          maxWidth: "500px",
        }}
      >
        {Array.from({ length: capped }).map((_, i) => (
          <div
            key={i}
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: color,
              opacity: 0.8,
              animation: `fadeInDot 0.5s ease-out ${i * 6}ms both`,
            }}
          />
        ))}
      </div>
      {scale > 1 && (
        <p style={{ fontFamily: sans, fontSize: "0.72rem", color: "#525252" }}>
          Each dot &asymp; {Math.round(scale).toLocaleString()} {label}
        </p>
      )}
    </div>
  );
}
