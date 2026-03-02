"use client";

import { useState } from "react";
import AnimatedNumber from "./AnimatedNumber";
import DotGrid from "./DotGrid";
import { sans } from "@/lib/constants";

export default function DataSection({
  gaza,
  westBank,
}: {
  gaza: {
    killed?: {
      total?: number;
      children?: number;
      women?: number;
      press?: number;
      medical?: number;
      civil_defence?: number;
    };
    injured?: { total?: number };
    massacres?: number;
    famine?: { children?: number };
    aid_seeker?: { killed?: number };
  };
  westBank: {
    killed?: { total?: number; children?: number };
    injured?: { total?: number };
    settler_attacks?: number;
  };
}) {
  const [dataTab, setDataTab] = useState(0);
  const g = gaza;
  const wb = westBank;

  return (
    <section
      id="data"
      style={{
        padding: "7rem 2rem",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(255,255,255,0.008)",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div className="section-label">The Scale</div>
        <h2 className="section-title">By the numbers</h2>
        <p className="section-desc" style={{ marginBottom: "2.5rem" }}>
          All data is open-source, publicly verifiable, and updated daily.
        </p>

        <div className="tab-bar">
          {["Gaza", "West Bank", "Visual Scale", "Infrastructure"].map(
            (label, i) => (
              <button
                key={i}
                className={dataTab === i ? "active" : ""}
                onClick={() => setDataTab(i)}
              >
                {label}
              </button>
            )
          )}
        </div>

        {dataTab === 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              { l: "Total Killed", v: g.killed?.total, c: "#dc2626" },
              { l: "Children Killed", v: g.killed?.children, c: "#dc2626" },
              { l: "Women Killed", v: g.killed?.women, c: "#dc2626" },
              { l: "Total Injured", v: g.injured?.total, c: "#f59e0b" },
              { l: "Journalists Killed", v: g.killed?.press, c: "#dc2626" },
              { l: "Medical Workers Killed", v: g.killed?.medical, c: "#dc2626" },
              { l: "Civil Defence Killed", v: g.killed?.civil_defence, c: "#dc2626" },
              { l: "Massacres", v: g.massacres, c: "#dc2626" },
              { l: "Children Starved", v: g.famine?.children, c: "#dc2626" },
              { l: "Aid Seekers Killed", v: g.aid_seeker?.killed, c: "#dc2626" },
            ].map((s, i) => (
              <div key={i} className="card">
                <p className="stat-num" style={{ color: s.c }}>
                  <AnimatedNumber value={s.v || 0} />
                </p>
                <p className="stat-label">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        {dataTab === 1 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              { l: "Total Killed", v: wb.killed?.total, c: "#dc2626" },
              { l: "Children Killed", v: wb.killed?.children, c: "#dc2626" },
              { l: "Total Injured", v: wb.injured?.total, c: "#f59e0b" },
              { l: "Settler Attacks", v: wb.settler_attacks, c: "#dc2626" },
            ].map((s, i) => (
              <div key={i} className="card">
                <p className="stat-num" style={{ color: s.c }}>
                  <AnimatedNumber value={s.v || 0} />
                </p>
                <p className="stat-label">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        {dataTab === 2 && (
          <div>
            <p
              style={{
                fontFamily: sans,
                color: "#a3a3a3",
                fontSize: "0.9rem",
                marginBottom: "2rem",
                lineHeight: 1.7,
              }}
            >
              Numbers are abstract. This visualization shows the human scale.
              Each dot represents real people.
            </p>
            <h3
              style={{
                fontFamily: sans,
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                color: "#e5e5e5",
              }}
            >
              Children killed in Gaza &mdash;{" "}
              {(g.killed?.children || 0).toLocaleString()}
            </h3>
            <DotGrid
              count={g.killed?.children || 0}
              label="children"
              color="#dc2626"
            />
            <h3
              style={{
                fontFamily: sans,
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                color: "#e5e5e5",
                marginTop: "2.5rem",
              }}
            >
              Total injured &mdash; {(g.injured?.total || 0).toLocaleString()}
            </h3>
            <DotGrid
              count={g.injured?.total || 0}
              label="people"
              color="#f59e0b"
              maxDots={200}
            />
          </div>
        )}

        {dataTab === 3 && (
          <div>
            <p
              style={{
                fontFamily: sans,
                color: "#a3a3a3",
                fontSize: "0.9rem",
                marginBottom: "2rem",
                lineHeight: 1.7,
              }}
            >
              Beyond the human toll, civilian infrastructure &mdash; hospitals,
              schools, mosques, and homes &mdash; has been systematically
              damaged. See the full infrastructure dataset at{" "}
              <a
                href="https://data.techforpalestine.org/docs/infrastructure-damaged/"
                target="_blank"
                rel="noopener"
                style={{ color: "#dc2626", textDecoration: "underline" }}
              >
                data.techforpalestine.org
              </a>
              .
            </p>
            <div className="card" style={{ maxWidth: "420px" }}>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: "0.9rem",
                  color: "#e5e5e5",
                  lineHeight: 1.7,
                }}
              >
                The infrastructure damage dataset tracks weekly reports of
                damage to mosques, churches, hospitals, schools, universities,
                bakeries, and other civilian infrastructure. It is updated
                weekly.
              </p>
              <a
                href="https://data.techforpalestine.org/docs/infrastructure-damaged/"
                target="_blank"
                rel="noopener"
                className="btn-secondary"
                style={{
                  marginTop: "1rem",
                  padding: "10px 20px",
                  fontSize: "0.82rem",
                }}
              >
                View Full Dataset &rarr;
              </a>
            </div>
          </div>
        )}

        <p
          style={{
            fontFamily: sans,
            color: "#404040",
            fontSize: "0.75rem",
            marginTop: "2.5rem",
          }}
        >
          Source:{" "}
          <a
            href="https://data.techforpalestine.org"
            target="_blank"
            rel="noopener"
            style={{ color: "#525252", textDecoration: "underline" }}
          >
            data.techforpalestine.org
          </a>{" "}
          &middot; Open-source &middot; API updates daily
        </p>
      </div>
    </section>
  );
}
