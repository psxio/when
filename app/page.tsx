"use client";

import { useState, useEffect, useCallback } from "react";
import {
  API_SUMMARY,
  API_NAMES,
  FALLBACK_SUMMARY,
  FALLBACK_NAMES,
  NAV_ITEMS,
  sans,
  type SummaryData,
  type NameEntry,
} from "@/lib/constants";
import NavBar from "@/components/NavBar";
import Ticker from "@/components/Ticker";
import Toast from "@/components/Toast";
import HeroSection from "@/components/HeroSection";
import NamesSection from "@/components/NamesSection";
import DataSection from "@/components/DataSection";
import ActSection from "@/components/ActSection";
import BuildSection from "@/components/BuildSection";
import Footer from "@/components/Footer";

export default function Page() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [names, setNames] = useState<NameEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("hero");
  const [toastState, setToastState] = useState({
    message: "",
    visible: false,
  });

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        const [sRes, nRes] = await Promise.all([
          fetch(API_SUMMARY)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch(API_NAMES)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        setData(sRes || FALLBACK_SUMMARY);
        setNames(nRes || FALLBACK_NAMES);
      } catch {
        setData(FALLBACK_SUMMARY);
        setNames(FALLBACK_NAMES);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Scroll spy
  useEffect(() => {
    if (loading) return;
    const sections = NAV_ITEMS.map((n) =>
      document.getElementById(n.id)
    ).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible.length > 0) setActiveNav(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [loading]);

  const showToast = useCallback((msg: string) => {
    setToastState({ message: msg, visible: true });
    setTimeout(
      () => setToastState((t) => ({ ...t, visible: false })),
      2500
    );
  }, []);

  const copyText = useCallback(
    (text: string) => {
      navigator.clipboard
        ?.writeText(text)
        .then(() => showToast("Copied to clipboard"));
    },
    [showToast]
  );

  const shareAction = useCallback(() => {
    const g = data?.gaza || FALLBACK_SUMMARY.gaza;
    const text = `${(g.killed?.total || 0).toLocaleString()} killed in Gaza. ${(g.killed?.children || 0).toLocaleString()} of them children. See the live data and take action:`;
    if (navigator.share) {
      navigator
        .share({
          title: "Remember Palestine",
          text,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      copyText(text + " " + window.location.href);
    }
  }, [data, copyText]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0a0a0a",
          fontFamily: sans,
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
            Loading live data from Palestine Datasets&hellip;
          </p>
        </div>
      </div>
    );
  }

  const g = data?.gaza || FALLBACK_SUMMARY.gaza;
  const wb = data?.west_bank || FALLBACK_SUMMARY.west_bank;
  const childNames = (names || FALLBACK_NAMES).slice(0, 20);

  return (
    <div
      style={{
        backgroundColor: "#0a0a0a",
        color: "#e5e5e5",
        minHeight: "100vh",
      }}
    >
      <Toast {...toastState} />
      <NavBar active={activeNav} />

      <div style={{ paddingTop: "56px" }}>
        <Ticker data={data} />
      </div>

      <HeroSection gaza={g} onShare={shareAction} />
      <NamesSection
        childNames={childNames}
        knownRecords={data?.known_killed_in_gaza?.records || 18000}
      />
      <DataSection gaza={g} westBank={wb} />
      <ActSection
        gaza={g}
        onShare={shareAction}
        onCopyStats={() => {
          const text = `${(g.killed?.total || 0).toLocaleString()} killed in Gaza.\n${(g.killed?.children || 0).toLocaleString()} were children.\n${(g.injured?.total || 0).toLocaleString()} injured.\n\nLive data: https://data.techforpalestine.org`;
          copyText(text);
        }}
      />
      <BuildSection onCopy={copyText} />
      <Footer />
    </div>
  );
}
