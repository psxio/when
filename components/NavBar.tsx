"use client";

import { useState, useEffect } from "react";
import { NAV_ITEMS, ff, sans } from "@/lib/constants";

export default function NavBar({ active }: { active: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    try {
      const handler = () => setScrolled(window.scrollY > 40);
      window.addEventListener("scroll", handler, { passive: true });
      return () => window.removeEventListener("scroll", handler);
    } catch {
      // scroll handler not available
    }
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(10,10,10,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid transparent",
        transition: "all 0.35s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px",
        }}
      >
        <a
          href="#hero"
          style={{
            fontFamily: ff,
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            color: "#e5e5e5",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ color: "#dc2626", fontSize: "1.2em" }}>&#9673;</span>
          Remember Palestine
        </a>
        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          {(Array.isArray(NAV_ITEMS) ? NAV_ITEMS.filter((_, i) => i > 0) : []).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              style={{
                fontFamily: sans,
                fontSize: "0.78rem",
                fontWeight: 500,
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: "4px",
                transition: "all 0.25s",
                color: active === item.id ? "#dc2626" : "#737373",
                background:
                  active === item.id ? "rgba(220,38,38,0.06)" : "transparent",
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
