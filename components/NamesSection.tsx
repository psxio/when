"use client";

import { sans, mono, type NameEntry } from "@/lib/constants";

export default function NamesSection({
  childNames,
  knownRecords,
}: {
  childNames: NameEntry[];
  knownRecords: number;
}) {
  return (
    <section
      id="names"
      style={{
        padding: "7rem 2rem",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div className="section-label">Their Names</div>
        <h2 className="section-title">
          Children killed, counted by first name
        </h2>
        <p className="section-desc" style={{ marginBottom: "3rem" }}>
          Data from Tech for Palestine&apos;s verified dataset. Each number
          represents children who shared that name &mdash; each one a unique
          life, a unique loss.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "3rem",
          }}
        >
          {childNames.map((n, i) => (
            <div
              key={i}
              className="name-pill"
              style={{
                animation: `slideIn 0.5s ease-out ${i * 50}ms both`,
              }}
            >
              <span style={{ fontWeight: 600, color: "#e5e5e5" }}>
                {n.name}
              </span>
              <span
                style={{
                  color: "#dc2626",
                  fontWeight: 700,
                  fontFamily: mono,
                  fontSize: "0.8rem",
                }}
              >
                {n.count?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "rgba(220,38,38,0.04)",
            border: "1px solid rgba(220,38,38,0.1)",
            borderRadius: "8px",
            padding: "1.25rem 1.5rem",
          }}
        >
          <p
            style={{
              fontFamily: sans,
              fontSize: "0.85rem",
              color: "#a3a3a3",
              lineHeight: 1.7,
            }}
          >
            These counts are derived from the{" "}
            <a
              href="https://data.techforpalestine.org/docs/killed-in-gaza/"
              target="_blank"
              rel="noopener"
              style={{
                color: "#dc2626",
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
            >
              Killed in Gaza
            </a>{" "}
            verified name list &mdash; an open-source dataset with{" "}
            {knownRecords.toLocaleString()} individually identified names. The
            true toll is significantly higher.
          </p>
        </div>
      </div>
    </section>
  );
}
