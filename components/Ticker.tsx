"use client";

import { mono, type SummaryData } from "@/lib/constants";

export default function Ticker({ data }: { data: SummaryData | null }) {
  if (!data) return null;
  const g = data.gaza || {};
  const items = [
    `${(g.killed?.total || 0).toLocaleString()} killed in Gaza`,
    `${(g.killed?.children || 0).toLocaleString()} children killed`,
    `${(g.injured?.total || 0).toLocaleString()} injured`,
    `${(g.killed?.press || 0).toLocaleString()} journalists killed`,
    `${(g.killed?.medical || 0).toLocaleString()} medical workers killed`,
    `Updated: ${g.last_update || "\u2014"}`,
  ];
  const doubled = [...items, ...items];
  return (
    <div
      style={{
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "10px 0",
        background: "rgba(220,38,38,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "3rem",
          whiteSpace: "nowrap",
          animation: "tickerScroll 30s linear infinite",
          width: "max-content",
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: mono,
              fontSize: "0.7rem",
              color: "#737373",
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ color: "#dc2626", marginRight: "6px" }}>&#9679;</span>{" "}
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
