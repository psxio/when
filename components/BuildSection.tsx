"use client";

import { sans, mono } from "@/lib/constants";

export default function BuildSection({
  onCopy,
}: {
  onCopy: (text: string) => void;
}) {
  const codeSnippet = `fetch("https://data.techforpalestine.org/api/v3/summary.min.json")
  .then(r => r.json())
  .then(data => console.log(data.gaza.killed))`;

  return (
    <section
      id="build"
      style={{
        padding: "7rem 2rem",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(255,255,255,0.008)",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div className="section-label">For Developers</div>
        <h2 className="section-title">Build something with this data</h2>
        <p className="section-desc" style={{ marginBottom: "3rem" }}>
          Tech for Palestine&apos;s API is free, open-source, and requires no
          API key. Pull live data into your own projects, visualizations, and
          tools.
        </p>

        <h3
          style={{
            fontFamily: sans,
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "1rem",
            color: "#e5e5e5",
          }}
        >
          Quick start &mdash; fetch the summary
        </h3>
        <div
          className="code-block"
          style={{ marginBottom: "1.5rem", position: "relative" }}
        >
          <button
            onClick={() => onCopy(codeSnippet)}
            style={{
              position: "absolute",
              top: "0.75rem",
              right: "0.75rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
              padding: "4px 10px",
              color: "#737373",
              cursor: "pointer",
              fontFamily: mono,
              fontSize: "0.7rem",
            }}
          >
            Copy
          </button>
          {codeSnippet}
        </div>

        <h3
          style={{
            fontFamily: sans,
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "1rem",
            color: "#e5e5e5",
          }}
        >
          Available endpoints
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {[
            {
              path: "/api/v3/summary.json",
              desc: "Cumulative totals \u2014 Gaza & West Bank",
            },
            {
              path: "/api/v2/killed-in-gaza.json",
              desc: "Individually identified names",
            },
            {
              path: "/api/v2/killed-in-gaza/child-name-counts-en.json",
              desc: "Children killed, grouped by first name",
            },
            {
              path: "/api/v3/press-killed-in-gaza.json",
              desc: "Journalists killed",
            },
          ].map((ep, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "baseline",
                padding: "0.5rem 0",
              }}
            >
              <code
                style={{
                  fontFamily: mono,
                  fontSize: "0.78rem",
                  color: "#dc2626",
                  whiteSpace: "nowrap",
                }}
              >
                {ep.path}
              </code>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: "0.82rem",
                  color: "#525252",
                }}
              >
                {ep.desc}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href="https://data.techforpalestine.org/docs/datasets/"
            target="_blank"
            rel="noopener"
            className="btn-secondary"
          >
            Full API Docs &rarr;
          </a>
          <a
            href="https://github.com/TechForPalestine/palestine-datasets"
            target="_blank"
            rel="noopener"
            className="btn-secondary"
          >
            GitHub Repo &rarr;
          </a>
          <a
            href="https://data.techforpalestine.org/docs/examples/"
            target="_blank"
            rel="noopener"
            className="btn-secondary"
          >
            Example Projects &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
