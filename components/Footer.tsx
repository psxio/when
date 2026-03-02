"use client";

import { ff, sans } from "@/lib/constants";

export default function Footer() {
  return (
    <footer
      style={{
        padding: "4rem 2rem",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: ff,
            fontWeight: 700,
            fontSize: "1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ color: "#dc2626" }}>&#9673;</span> Remember Palestine
        </p>
        <p
          style={{
            fontFamily: sans,
            color: "#404040",
            fontSize: "0.8rem",
            lineHeight: 1.8,
            maxWidth: "500px",
            marginBottom: "1.5rem",
          }}
        >
          Built with open-source data from{" "}
          <a
            href="https://data.techforpalestine.org"
            target="_blank"
            rel="noopener"
            style={{ color: "#525252", textDecoration: "underline" }}
          >
            Tech for Palestine
          </a>
          . All data is publicly verifiable. This project is free to fork, host,
          and share.
        </p>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            fontFamily: sans,
            fontSize: "0.78rem",
          }}
        >
          <a
            href="https://techforpalestine.org"
            target="_blank"
            rel="noopener"
            style={{ color: "#525252", textDecoration: "none" }}
          >
            Tech for Palestine
          </a>
          <a
            href="https://github.com/TechForPalestine/palestine-datasets"
            target="_blank"
            rel="noopener"
            style={{ color: "#525252", textDecoration: "none" }}
          >
            Data Source
          </a>
          <a
            href="https://data.techforpalestine.org/docs/examples/"
            target="_blank"
            rel="noopener"
            style={{ color: "#525252", textDecoration: "none" }}
          >
            Examples
          </a>
        </div>
      </div>
    </footer>
  );
}
