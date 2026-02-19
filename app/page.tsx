"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RiskFactor {
  label: string;
  score: number;
  description: string;
}

interface PredictionResult {
  predictedDate: string;
  confidence: number;
  daysRemaining: number;
  riskFactors: RiskFactor[];
  overallRisk: string;
  analysisId: string;
}

type Phase = "idle" | "analyzing" | "result";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  "Initializing behavioral analysis engine",
  "Scanning search pattern deviations",
  "Correlating EHR mortality indicators",
  "Processing life2vec embeddings",
  "Computing temporal mortality index",
  "Generating prediction matrix",
];

const STEP_DELAYS = [700, 850, 800, 1100, 750, 600];

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPredictedDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function riskColor(risk: string): string {
  switch (risk) {
    case "LOW":
      return "text-green-500";
    case "MODERATE":
      return "text-yellow-500";
    case "ELEVATED":
      return "text-orange-400";
    case "HIGH":
      return "text-red-500";
    case "CRITICAL":
      return "text-red-600";
    default:
      return "text-bone";
  }
}

function barColor(score: number): string {
  if (score > 65) return "#7A2020";
  if (score > 40) return "#C9A84C";
  return "#4a7c59";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");
  const [displayDays, setDisplayDays] = useState(0);
  const [barsRevealed, setBarsRevealed] = useState(false);

  // Capture input values at submission time to avoid stale closures
  const pendingRef = useRef({ name: "", birthYear: "" });

  /* ---- Submit ---------------------------------------------------- */

  const handlePredict = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    pendingRef.current = { name: trimmed, birthYear };
    setPhase("analyzing");
    setStepIdx(0);
    setError("");
    setResult(null);
    setDisplayDays(0);
    setBarsRevealed(false);
  }, [name, birthYear]);

  /* ---- Analysis sequence ----------------------------------------- */

  useEffect(() => {
    if (phase !== "analyzing") return;

    let cancelled = false;

    async function run() {
      // Step through analysis phases
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        await new Promise<void>((r) => setTimeout(r, STEP_DELAYS[i]));
        if (cancelled) return;
        setStepIdx(i + 1);
      }

      // Brief pause before reveal
      await new Promise<void>((r) => setTimeout(r, 500));
      if (cancelled) return;

      // Fetch prediction
      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pendingRef.current.name,
            birthYear: pendingRef.current.birthYear || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error || "Prediction failed"
          );
        }

        const data: PredictionResult = await res.json();
        if (cancelled) return;

        setResult(data);
        setPhase("result");
        setBarsRevealed(true);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Analysis failed. Try again."
        );
        setPhase("idle");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  /* ---- Days-remaining counter animation -------------------------- */

  useEffect(() => {
    if (phase !== "result" || !result) return;

    const target = result.daysRemaining;
    const duration = 2200;
    let start: number | null = null;
    let raf: number;

    function tick(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplayDays(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }

    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 2800); // wait for date reveal

    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [phase, result]);

  /* ---- Reset ----------------------------------------------------- */

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setName("");
    setBirthYear("");
    setError("");
    setDisplayDays(0);
    setBarsRevealed(false);
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <main className="grain vignette min-h-screen relative overflow-hidden">
      {/* Ambient light orb */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div
          className={`w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full blur-[160px] transition-all duration-[5000ms] ${
            phase === "result"
              ? "bg-ember/[0.05]"
              : phase === "analyzing"
                ? "bg-ember/[0.025]"
                : "bg-ember/[0.012]"
          }`}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        {/* ========================================================= */}
        {/*  IDLE                                                      */}
        {/* ========================================================= */}
        {phase === "idle" && (
          <div className="flex flex-col items-center w-full max-w-md anim-fade-in">
            {/* Title */}
            <h1 className="font-display font-bold text-[20vw] md:text-[13vw] leading-[0.82] tracking-[-0.03em] text-bone select-none">
              WHEN
            </h1>

            <div className="w-14 h-px bg-ember mt-7 mb-10" />

            <p className="font-body text-base md:text-lg text-smoke text-center leading-relaxed max-w-sm mb-14">
              Mortality prediction engine powered by behavioral analysis, search
              pattern modeling, and life2vec deep learning.
            </p>

            {/* Inputs */}
            <div className="w-full space-y-5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePredict()}
                placeholder="Enter full name"
                maxLength={100}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent border-b border-ash focus:border-ember text-bone font-mono text-base py-3 outline-none transition-colors duration-300 placeholder:text-[#2a2a2a]"
              />

              <input
                type="text"
                inputMode="numeric"
                value={birthYear}
                onChange={(e) =>
                  setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                onKeyDown={(e) => e.key === "Enter" && handlePredict()}
                placeholder="Birth year (optional)"
                autoComplete="off"
                className="w-full bg-transparent border-b border-ash focus:border-ember text-bone font-mono text-base py-3 outline-none transition-colors duration-300 placeholder:text-[#2a2a2a]"
              />

              <button
                onClick={handlePredict}
                disabled={!name.trim()}
                className="w-full py-4 mt-2 font-mono text-[11px] tracking-[0.3em] uppercase border border-ash text-bone/50 hover:border-ember hover:text-ember disabled:opacity-[0.12] disabled:cursor-not-allowed transition-all duration-300 active:scale-[0.98]"
              >
                Predict
              </button>
            </div>

            {error && (
              <p className="mt-8 text-blood font-mono text-sm anim-fade-in">
                {error}
              </p>
            )}

            <p className="mt-20 text-[#1e1e1e] font-mono text-[10px] text-center leading-relaxed max-w-xs select-none">
              For entertainment purposes only. Predictions are algorithmically
              generated and do not constitute medical or professional advice.
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/*  ANALYZING                                                 */}
        {/* ========================================================= */}
        {phase === "analyzing" && (
          <div className="flex flex-col items-center w-full max-w-md anim-fade-in">
            <h2 className="font-display font-bold text-5xl md:text-6xl text-bone tracking-[-0.02em] select-none mb-14">
              WHEN
            </h2>

            {/* Scanning line */}
            <div className="w-full h-px bg-ash/40 mb-14 relative overflow-hidden">
              <div className="absolute h-full w-20 bg-gradient-to-r from-transparent via-ember/80 to-transparent anim-scan" />
            </div>

            {/* Steps */}
            <div className="w-full space-y-4">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 font-mono text-sm transition-all duration-500 ${
                    i < stepIdx
                      ? "text-ember/70"
                      : i === stepIdx
                        ? "text-bone"
                        : "text-[#181818]"
                  }`}
                >
                  <span className="w-3 shrink-0 text-center text-xs">
                    {i < stepIdx ? "✓" : i === stepIdx ? "›" : "·"}
                  </span>
                  <span className="truncate">{step}</span>
                  {i === stepIdx && (
                    <span className="ml-auto text-ember animate-pulse shrink-0 text-xs">
                      ...
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full mt-14 relative">
              <div className="h-px bg-ash/30 w-full" />
              <div
                className="h-px bg-ember absolute top-0 left-0 transition-all duration-700 ease-out"
                style={{ width: `${(stepIdx / STEPS.length) * 100}%` }}
              />
            </div>

            <p className="mt-8 font-mono text-[10px] text-[#333] tracking-[0.2em]">
              {Math.round((stepIdx / STEPS.length) * 100)}% COMPLETE
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/*  RESULT                                                    */}
        {/* ========================================================= */}
        {phase === "result" && result && (
          <div className="flex flex-col items-center w-full max-w-xl">
            {/* Analysis ID */}
            <div
              className="font-mono text-[10px] text-[#333] tracking-[0.2em] mb-10 opacity-0 anim-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              ANALYSIS #{result.analysisId}
            </div>

            {/* ---- THE DATE ---- */}
            <div className="font-display font-bold text-[7.5vw] sm:text-4xl md:text-[3.2rem] tracking-[0.04em] text-center leading-tight mb-6">
              {formatPredictedDate(result.predictedDate)
                .split("")
                .map((char, i) => (
                  <span
                    key={i}
                    className="inline-block opacity-0 anim-char-reveal"
                    style={{ animationDelay: `${0.4 + i * 0.055}s` }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
            </div>

            {/* Days remaining */}
            <div
              className="text-center opacity-0 anim-fade-in"
              style={{ animationDelay: "2.8s" }}
            >
              <div className="font-mono text-2xl md:text-3xl text-ember tabular-nums">
                {displayDays.toLocaleString()}
              </div>
              <div className="font-mono text-[10px] text-[#444] tracking-[0.3em] mt-1">
                DAYS REMAINING
              </div>
            </div>

            {/* Flatline */}
            <div
              className="w-full my-12 opacity-0 anim-fade-in"
              style={{ animationDelay: "3.2s" }}
            >
              <div className="h-px bg-blood/50 anim-flatline" />
            </div>

            {/* Risk Assessment */}
            <div
              className="w-full opacity-0 anim-fade-in"
              style={{ animationDelay: "3.6s" }}
            >
              <h3 className="font-mono text-[10px] text-[#444] tracking-[0.3em] mb-8">
                RISK ASSESSMENT
              </h3>

              <div className="space-y-5">
                {result.riskFactors.map((f, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-mono text-xs text-bone/60">
                        {f.label}
                      </span>
                      <span className="font-mono text-xs text-ember/70 tabular-nums">
                        {f.score}%
                      </span>
                    </div>
                    <div className="h-[3px] bg-ash/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-[1200ms] ease-out"
                        style={{
                          width: barsRevealed ? `${f.score}%` : "0%",
                          transitionDelay: `${3.8 + i * 0.2}s`,
                          backgroundColor: barColor(f.score),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-10 pt-8 border-t border-ash/30">
                <div>
                  <span className="font-mono text-[10px] text-[#444] tracking-wider">
                    RISK LEVEL{" "}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold tracking-wider ${riskColor(result.overallRisk)}`}
                  >
                    {result.overallRisk}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#444] tracking-wider">
                    CONFIDENCE{" "}
                  </span>
                  <span className="font-mono text-xs text-ember tabular-nums">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={reset}
              className="mt-16 py-3 px-10 font-mono text-[10px] tracking-[0.3em] uppercase border border-ash/40 text-bone/30 hover:border-ember hover:text-ember transition-all duration-300 active:scale-[0.98] opacity-0 anim-fade-in"
              style={{ animationDelay: "5.5s" }}
            >
              Analyze Another
            </button>

            <p
              className="mt-12 text-[#1a1a1a] font-mono text-[10px] text-center leading-relaxed max-w-xs select-none opacity-0 anim-fade-in"
              style={{ animationDelay: "5.5s" }}
            >
              For entertainment purposes only. Predictions are algorithmically
              generated and do not constitute medical or professional advice.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
