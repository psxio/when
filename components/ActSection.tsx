"use client";

import { AID_ORGS, REP_LINKS, ff, sans, mono } from "@/lib/constants";

export default function ActSection({
  gaza,
  onShare,
  onCopyStats,
}: {
  gaza: {
    killed?: { total?: number; children?: number };
    injured?: { total?: number };
  };
  onShare: () => void;
  onCopyStats: () => void;
}) {
  return (
    <section
      id="act"
      style={{
        padding: "7rem 2rem",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div className="section-label">What you can do</div>
        <h2 className="section-title">Take action now</h2>
        <p className="section-desc" style={{ marginBottom: "3.5rem" }}>
          Every action matters. Donate, call your representatives, share this
          page, or volunteer your skills.
        </p>

        {/* Donate */}
        <h3
          style={{
            fontFamily: sans,
            fontWeight: 600,
            fontSize: "1.05rem",
            marginBottom: "1.25rem",
            color: "#e5e5e5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{ fontFamily: mono, color: "#dc2626", fontSize: "0.85rem" }}
          >
            01
          </span>{" "}
          Donate to Verified Organizations
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: "1rem",
            marginBottom: "4rem",
          }}
        >
          {AID_ORGS.map((org, i) => (
            <a
              key={i}
              href={org.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card card-link"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.5rem",
                }}
              >
                <p
                  style={{ fontFamily: ff, fontWeight: 700, fontSize: "1.1rem" }}
                >
                  {org.name}
                </p>
                <span className="org-tag">{org.tag}</span>
              </div>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: "0.78rem",
                  color: "#dc2626",
                  marginBottom: "0.5rem",
                }}
              >
                {org.full}
              </p>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: "0.8rem",
                  color: "#737373",
                  lineHeight: 1.6,
                }}
              >
                {org.desc}
              </p>
            </a>
          ))}
        </div>

        {/* Contact Reps */}
        <h3
          style={{
            fontFamily: sans,
            fontWeight: 600,
            fontSize: "1.05rem",
            marginBottom: "1.25rem",
            color: "#e5e5e5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{ fontFamily: mono, color: "#dc2626", fontSize: "0.85rem" }}
          >
            02
          </span>{" "}
          Contact Your Representatives
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            marginBottom: "4rem",
            maxWidth: "520px",
          }}
        >
          {REP_LINKS.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rep-link"
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span>{link.flag}</span>
                <span>{link.label}</span>
              </span>
              <span style={{ color: "#525252" }}>&rarr;</span>
            </a>
          ))}
        </div>

        {/* Volunteer */}
        <h3
          style={{
            fontFamily: sans,
            fontWeight: 600,
            fontSize: "1.05rem",
            marginBottom: "1.25rem",
            color: "#e5e5e5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{ fontFamily: mono, color: "#dc2626", fontSize: "0.85rem" }}
          >
            03
          </span>{" "}
          Volunteer Your Tech Skills
        </h3>
        <a
          href="https://techforpalestine.org/get-involved"
          target="_blank"
          rel="noopener noreferrer"
          className="card card-link"
          style={{ maxWidth: "420px", marginBottom: "4rem" }}
        >
          <p
            style={{
              fontFamily: ff,
              fontWeight: 700,
              fontSize: "1.1rem",
              marginBottom: "0.25rem",
            }}
          >
            Tech for Palestine
          </p>
          <p
            style={{
              fontFamily: sans,
              fontSize: "0.8rem",
              color: "#737373",
              lineHeight: 1.6,
            }}
          >
            Join thousands of developers, designers, and product people building
            open-source tools for Palestinian freedom. All skill levels welcome.
          </p>
        </a>

        {/* Share */}
        <h3
          style={{
            fontFamily: sans,
            fontWeight: 600,
            fontSize: "1.05rem",
            marginBottom: "1rem",
            color: "#e5e5e5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{ fontFamily: mono, color: "#dc2626", fontSize: "0.85rem" }}
          >
            04
          </span>{" "}
          Share This Page
        </h3>
        <p
          style={{
            fontFamily: sans,
            color: "#737373",
            fontSize: "0.9rem",
            lineHeight: 1.7,
            marginBottom: "1.25rem",
            maxWidth: "480px",
          }}
        >
          Awareness drives action. This page is open-source and free to fork,
          host, and distribute.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={onShare}>
            Share This Page
          </button>
          <button className="btn-secondary" onClick={onCopyStats}>
            Copy Stats
          </button>
        </div>
      </div>
    </section>
  );
}
