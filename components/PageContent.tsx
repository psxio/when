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

export default function PageContent() {
  const [data, setData] = useState<SummaryData>(FALLBACK_SUMMARY);
  const [names, setNames] = useState<NameEntry[]>(FALLBACK_NAMES);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("hero");
  const [toastState, setToastState] = useState({
    message: "",
    visible: false,
  });

  // Fetch data
  useEffect(() => {
    let cancelled = false;
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
        if (cancelled) return;
        const validSummary =
          sRes &&
          typeof sRes === "object" &&
          !Array.isArray(sRes) &&
          sRes.gaza &&
          typeof sRes.gaza === "object";
        setData(validSummary ? sRes : FALLBACK_SUMMARY);
        setNames(
          Array.isArray(nRes) && nRes.length > 0 ? nRes : FALLBACK_NAMES
        );
      } catch {
        if (!cancelled) {
          setData(FALLBACK_SUMMARY);
          setNames(FALLBACK_NAMES);
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll spy
  useEffect(() => {
    if (loading) return;
    try {
      const navItems = Array.isArray(NAV_ITEMS) ? NAV_ITEMS : [];
      const sections = navItems.map((n) =>
        document.getElementById(n.id)
      ).filter(Boolean) as HTMLElement[];
      if (sections.length === 0) return;
      const observer = new IntersectionObserver(
        (entries) => {
          try {
            const visible = entries
              .filter((e) => e.isIntersecting)
              .sort(
                (a, b) =>
                  a.boundingClientRect.top - b.boundingClientRect.top
              );
            if (visible.length > 0) setActiveNav(visible[0].target.id);
          } catch {
            // ignore scroll spy errors
          }
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      sections.forEach((s) => observer.observe(s));
      return () => observer.disconnect();
    } catch {
      // IntersectionObserver not supported or other error
    }
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
      try {
        navigator.clipboard
          ?.writeText(text)
          .then(() => showToast("Copied to clipboard"))
          .catch(() => {});
      } catch {
        // Clipboard API not available
      }
    },
    [showToast]
  );

  const shareAction = useCallback(() => {
    try {
      const g = data?.gaza || FALLBACK_SUMMARY.gaza;
      const url = typeof window !== "undefined" ? window.location.href : "";
      const text = `${(g.killed?.total || 0).toLocaleString()} killed in Gaza. ${(g.killed?.children || 0).toLocaleString()} of them children. See the live data and take action:`;
      if (typeof navigator !== "undefined" && navigator.share) {
        navigator
          .share({ title: "Remember Palestine", text, url })
          .catch(() => {});
      } else {
        copyText(text + " " + url);
      }
    } catch {
      // Share not available
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

  const g = (data && data.gaza) ? data.gaza : FALLBACK_SUMMARY.gaza;
  const wb = (data && data.west_bank) ? data.west_bank : FALLBACK_SUMMARY.west_bank;
  const safeNames: NameEntry[] = Array.isArray(names) ? names : Array.isArray(FALLBACK_NAMES) ? FALLBACK_NAMES : [];
  const childNames: NameEntry[] = [];
  for (let i = 0; i < 20 && i < safeNames.length; i++) {
    childNames.push(safeNames[i]);
  }

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
        <Ticker data={data || FALLBACK_SUMMARY} />
      </div>

      <HeroSection gaza={g} onShare={shareAction} />
      <NamesSection
        childNames={childNames}
        knownRecords={typeof data?.known_killed_in_gaza?.records === "number" ? data.known_killed_in_gaza.records : 18000}
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
