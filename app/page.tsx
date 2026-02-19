"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const RiskVisualization3D = dynamic(
  () => import("@/components/RiskVisualization3D"),
  { ssr: false }
);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Sample { x: number; y: number; t: number; }

interface RiskFactor { label: string; score: number; description: string; }

interface PredictionResult {
  predictedDate: string;
  confidence: number;
  daysRemaining: number;
  estimatedBioAge: number;
  riskFactors: RiskFactor[];
  overallRisk: string;
  analysisId: string;
  signalSummary: {
    dataPoints: number;
    curvatureIQR: number;
    entropy: number;
    circadianDev: number;
    latencyMs: number;
    velocityStd: number;
    jitter: number;
    keystrokeDwell: number;
    scrollReversals: number;
    jerkMean: number;
  };
  signalChannels: number;
}

interface BehavioralSignals {
  motor: {
    meanVelocity: number;
    velocityStd: number;
    velocitySkew: number;
    velocityKurtosis: number;
    meanAcceleration: number;
    accelerationStd: number;
    meanJerk: number;
    curvatureRatioMean: number;
    curvatureRatioIQR: number;
    idleTimeIQR: number;
    entropy: number;
    jitter: number;
    dataPoints: number;
    movementSegments: number;
    silenceSegments: number;
  };
  keystroke: {
    dwellMean: number;
    dwellStd: number;
    flightMean: number;
    flightStd: number;
    totalKeys: number;
    errorRate: number;
  };
  scroll: {
    velocityMean: number;
    velocityStd: number;
    reversals: number;
    totalEvents: number;
  };
  circadian: {
    hour: number;
    minute: number;
    dayOfWeek: number;
    timezone: string;
  };
  interaction: {
    timeOnPageMs: number;
    scrollEvents: number;
    tabSwitches: number;
    totalIdleMs: number;
    clickCount: number;
    meanClickDuration: number;
  };
  device: {
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
    touchCapable: boolean;
    colorScheme: string;
    language: string;
    platform: string;
  };
}

/** Real-time channel status for the landing page */
interface ChannelStatus {
  motor: number;       // data points
  keystroke: number;   // total keys
  scroll: number;      // scroll events
  click: number;       // click count
  attention: number;   // tab switches
  tremor: number;      // stillness samples
}

type Phase = "idle" | "analyzing" | "result";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  "Quantifying motor control signature",
  "Analyzing keystroke dynamics",
  "Computing circadian alignment index",
  "Measuring psychomotor response latency",
  "Extracting behavioral entropy",
  "Detecting micro-tremor signature",
  "Segmenting action sequences",
  "Generating temporal mortality projection",
];

const STEP_DELAYS = [700, 600, 650, 600, 800, 700, 900, 700];

const MONTHS = [
  "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
  "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER",
];

/* ------------------------------------------------------------------ */
/*  Statistics helpers                                                  */
/* ------------------------------------------------------------------ */

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function iqr(arr: number[]): number {
  if (arr.length < 4) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.75)] - sorted[Math.floor(sorted.length * 0.25)];
}

function skewness(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  const s = stdDev(arr);
  if (s === 0) return 0;
  const n = arr.length;
  return (arr.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0) * n) / ((n - 1) * (n - 2));
}

function kurtosis(arr: number[]): number {
  if (arr.length < 4) return 0;
  const m = mean(arr);
  const s = stdDev(arr);
  if (s === 0) return 0;
  const n = arr.length;
  return arr.reduce((acc, v) => acc + ((v - m) / s) ** 4, 0) / n - 3; // excess kurtosis
}

/* ------------------------------------------------------------------ */
/*  Multi-modal signal computation (enterprise-grade)                   */
/*                                                                     */
/*  Computes 40+ features across 6 behavioral channels:                */
/*  1. Motor control (velocity, acceleration, jerk, curvature, jitter) */
/*  2. Keystroke dynamics (dwell, flight, error rate)                   */
/*  3. Scroll behavior (velocity, reversals)                           */
/*  4. Click patterns (count, duration)                                */
/*  5. Attention (tab switches, idle time)                             */
/*  6. Tremor (micro-jitter during stillness periods)                  */
/* ------------------------------------------------------------------ */

function computeSignals(
  samples: Sample[],
  keyEvents: { key: string; down: number; up: number }[],
  scrollEvents: { t: number; deltaY: number }[],
  clickEvents: { down: number; up: number }[],
  tabSwitches: number,
  pageLoadTime: number,
): BehavioralSignals {
  // ---- Motor features ---- //
  const velocities: number[] = [];
  const accelerations: number[] = [];
  const jerks: number[] = [];
  const curvatures: number[] = [];
  const idleTimes: number[] = [];
  const angles: number[] = [];
  const jitterSamples: number[] = []; // displacement during stillness

  let movementSegments = 0;
  let silenceSegments = 0;
  let inMovement = false;

  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i].x - samples[i - 1].x;
    const dy = samples[i].y - samples[i - 1].y;
    const dt = samples[i].t - samples[i - 1].t;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dt > 0) {
      const vel = dist / dt;
      velocities.push(vel);
      angles.push(Math.atan2(dy, dx));

      // Acceleration (2nd derivative)
      if (velocities.length >= 2) {
        const prevVel = velocities[velocities.length - 2];
        accelerations.push((vel - prevVel) / dt);
      }

      // Jerk (3rd derivative)
      if (accelerations.length >= 2) {
        const prevAcc = accelerations[accelerations.length - 2];
        const acc = accelerations[accelerations.length - 1];
        jerks.push((acc - prevAcc) / dt);
      }

      // Action segmentation
      if (dist > 3) {
        if (!inMovement) { movementSegments++; inMovement = true; }
      } else {
        if (inMovement) { silenceSegments++; inMovement = false; }
        // Micro-jitter: displacement during near-stillness
        if (dist > 0.1 && dist <= 3) {
          jitterSamples.push(dist);
        }
      }
    }

    if (dt > 50) idleTimes.push(dt);
  }

  // Curvature ratio per 10-sample segment
  const segSize = 10;
  for (let i = 0; i + segSize <= samples.length; i += segSize) {
    const seg = samples.slice(i, i + segSize);
    const delta = Math.sqrt(
      (seg[seg.length - 1].x - seg[0].x) ** 2 + (seg[seg.length - 1].y - seg[0].y) ** 2
    );
    let path = 0;
    for (let j = 1; j < seg.length; j++) {
      path += Math.sqrt((seg[j].x - seg[j - 1].x) ** 2 + (seg[j].y - seg[j - 1].y) ** 2);
    }
    if (path > 0) curvatures.push(delta / path);
  }

  // Direction entropy (8 bins)
  const bins = new Array(8).fill(0);
  for (const a of angles) {
    bins[Math.floor(((a + Math.PI) / (2 * Math.PI)) * 8) % 8]++;
  }
  let entropy = 0;
  const totalAngles = angles.length || 1;
  for (const c of bins) {
    if (c > 0) {
      const p = c / totalAngles;
      entropy -= p * Math.log2(p);
    }
  }

  // ---- Keystroke features ---- //
  const dwells: number[] = [];
  const flights: number[] = [];
  let errorKeys = 0;

  for (let i = 0; i < keyEvents.length; i++) {
    const ev = keyEvents[i];
    if (ev.up > ev.down) dwells.push(ev.up - ev.down);
    if (ev.key === "Backspace" || ev.key === "Delete") errorKeys++;
    if (i > 0 && keyEvents[i - 1].up > 0) {
      const flight = ev.down - keyEvents[i - 1].up;
      if (flight > 0 && flight < 2000) flights.push(flight);
    }
  }

  // ---- Scroll features ---- //
  const scrollVelocities: number[] = [];
  let scrollReversals = 0;
  let lastScrollDir = 0;

  for (let i = 0; i < scrollEvents.length; i++) {
    const ev = scrollEvents[i];
    scrollVelocities.push(Math.abs(ev.deltaY));
    const dir = ev.deltaY > 0 ? 1 : -1;
    if (lastScrollDir !== 0 && dir !== lastScrollDir) scrollReversals++;
    lastScrollDir = dir;
  }

  // ---- Click features ---- //
  const clickDurations: number[] = [];
  for (const ev of clickEvents) {
    if (ev.up > ev.down) clickDurations.push(ev.up - ev.down);
  }

  // ---- Idle time ---- //
  let totalIdleMs = 0;
  for (const idle of idleTimes) {
    if (idle > 500) totalIdleMs += idle;
  }

  const now = new Date();

  return {
    motor: {
      meanVelocity: mean(velocities),
      velocityStd: stdDev(velocities),
      velocitySkew: skewness(velocities),
      velocityKurtosis: kurtosis(velocities),
      meanAcceleration: mean(accelerations),
      accelerationStd: stdDev(accelerations),
      meanJerk: mean(jerks.map(Math.abs)),
      curvatureRatioMean: mean(curvatures),
      curvatureRatioIQR: iqr(curvatures),
      idleTimeIQR: iqr(idleTimes),
      entropy,
      jitter: mean(jitterSamples),
      dataPoints: samples.length,
      movementSegments,
      silenceSegments,
    },
    keystroke: {
      dwellMean: mean(dwells),
      dwellStd: stdDev(dwells),
      flightMean: mean(flights),
      flightStd: stdDev(flights),
      totalKeys: keyEvents.length,
      errorRate: keyEvents.length > 0 ? errorKeys / keyEvents.length : 0,
    },
    scroll: {
      velocityMean: mean(scrollVelocities),
      velocityStd: stdDev(scrollVelocities),
      reversals: scrollReversals,
      totalEvents: scrollEvents.length,
    },
    circadian: {
      hour: now.getHours(),
      minute: now.getMinutes(),
      dayOfWeek: now.getDay(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    interaction: {
      timeOnPageMs: Date.now() - pageLoadTime,
      scrollEvents: scrollEvents.length,
      tabSwitches,
      totalIdleMs,
      clickCount: clickEvents.length,
      meanClickDuration: mean(clickDurations),
    },
    device: {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      touchCapable: "ontouchstart" in window,
      colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      language: navigator.language,
      platform: navigator.platform || "unknown",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Deep Scan                                                          */
/* ------------------------------------------------------------------ */

interface DeepScanResult {
  battery: { level: number; charging: boolean } | null;
  memory: number | null;
  cores: number | null;
  connection: { type: string; downlink: number; rtt: number } | null;
  storage: { used: number; quota: number } | null;
  timing: { domLoad: number; fullLoad: number } | null;
  sensors: string[];
}

async function performDeepScan(): Promise<DeepScanResult> {
  const r: DeepScanResult = {
    battery: null, memory: null, cores: null,
    connection: null, storage: null, timing: null, sensors: [],
  };

  try {
    const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (nav.getBattery) { const b = await nav.getBattery(); r.battery = { level: b.level, charging: b.charging }; }
  } catch { /* */ }

  try { const nav = navigator as unknown as { deviceMemory?: number }; if (nav.deviceMemory) r.memory = nav.deviceMemory; } catch { /* */ }
  try { if (navigator.hardwareConcurrency) r.cores = navigator.hardwareConcurrency; } catch { /* */ }

  try {
    const nav = navigator as unknown as { connection?: { effectiveType: string; downlink: number; rtt: number } };
    if (nav.connection) r.connection = { type: nav.connection.effectiveType, downlink: nav.connection.downlink, rtt: nav.connection.rtt };
  } catch { /* */ }

  try { if (navigator.storage?.estimate) { const e = await navigator.storage.estimate(); r.storage = { used: e.usage || 0, quota: e.quota || 0 }; } } catch { /* */ }

  try {
    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entries.length > 0) { const n = entries[0]; r.timing = { domLoad: Math.round(n.domContentLoadedEventEnd - n.startTime), fullLoad: Math.round(n.loadEventEnd - n.startTime) }; }
  } catch { /* */ }

  for (const s of ["Accelerometer", "Gyroscope", "Magnetometer", "AmbientLightSensor"]) {
    if (s in window) r.sensors.push(s);
  }
  return r;
}

/* ------------------------------------------------------------------ */
/*  Live Canvas                                                        */
/* ------------------------------------------------------------------ */

function LiveCanvas({ samplesRef }: { samplesRef: React.RefObject<Sample[]> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const samples = samplesRef.current;
      if (!samples || samples.length < 2) { raf = requestAnimationFrame(draw); return; }

      const pts = samples.slice(-200);
      const now = Date.now();

      for (let i = 1; i < pts.length; i++) {
        const age = (now - pts[i].t) / 5000;
        const alpha = Math.max(0, 0.08 - age * 0.08);
        if (alpha <= 0) continue;
        ctx.strokeStyle = `rgba(201, 168, 76, ${alpha})`;
        ctx.lineWidth = 0.5 * dpr;
        ctx.beginPath();
        ctx.moveTo((pts[i - 1].x / window.innerWidth) * w, (pts[i - 1].y / window.innerHeight) * h);
        ctx.lineTo((pts[i].x / window.innerWidth) * w, (pts[i].y / window.innerHeight) * h);
        ctx.stroke();
      }

      for (let i = 0; i < pts.length; i++) {
        const age = (now - pts[i].t) / 8000;
        const alpha = Math.max(0, 0.5 - age * 0.5);
        if (alpha <= 0) continue;
        const x = (pts[i].x / window.innerWidth) * w;
        const y = (pts[i].y / window.innerHeight) * h;
        let vel = 0;
        if (i > 0) {
          const dx = pts[i].x - pts[i - 1].x;
          const dy = pts[i].y - pts[i - 1].y;
          const dt = pts[i].t - pts[i - 1].t;
          if (dt > 0) vel = Math.sqrt(dx * dx + dy * dy) / dt;
        }
        const t = Math.min(vel / 2, 1);
        const r = Math.round(26 + t * 175);
        const g = Math.round(58 + t * 110);
        const b = Math.round(90 - t * 14);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, (1.5 + (1 - age) * 1.5) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [samplesRef]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }} />;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function riskColor(r: string): string {
  switch (r) {
    case "LOW": return "text-green-500";
    case "MODERATE": return "text-yellow-500";
    case "ELEVATED": return "text-orange-400";
    case "HIGH": return "text-red-500";
    case "CRITICAL": return "text-red-600";
    default: return "text-bone";
  }
}

function barColor(s: number): string {
  if (s > 65) return "#7A2020";
  if (s > 40) return "#C9A84C";
  return "#4a7c59";
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");

  // Multi-modal collection refs
  const samplesRef = useRef<Sample[]>([]);
  const keyEventsRef = useRef<{ key: string; down: number; up: number }[]>([]);
  const scrollEventsRef = useRef<{ t: number; deltaY: number }[]>([]);
  const clickEventsRef = useRef<{ down: number; up: number }[]>([]);
  const tabSwitchRef = useRef(0);
  const pageLoadRef = useRef(Date.now());
  const pendingKeyDown = useRef<Map<string, number>>(new Map());
  const pendingClickDown = useRef(0);

  // Channel status for live UI
  const [channels, setChannels] = useState<ChannelStatus>({
    motor: 0, keystroke: 0, scroll: 0, click: 0, attention: 0, tremor: 0,
  });
  const [ready, setReady] = useState(false);

  // Analysis
  const [stepIdx, setStepIdx] = useState(0);
  const [stepDetails, setStepDetails] = useState<string[]>([]);
  const signalsRef = useRef<BehavioralSignals | null>(null);

  // Result
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [displayDays, setDisplayDays] = useState(0);
  const [barsRevealed, setBarsRevealed] = useState(false);
  const [error, setError] = useState("");

  // 3D
  const [vizSamples, setVizSamples] = useState<Sample[]>([]);
  const [show3D, setShow3D] = useState(false);

  // Deep Scan
  const [deepScanResult, setDeepScanResult] = useState<DeepScanResult | null>(null);
  const [deepScanning, setDeepScanning] = useState(false);
  const [deepScanDone, setDeepScanDone] = useState(false);

  // Community
  const [contributed, setContributed] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [contributorCount, setContributorCount] = useState<number | null>(null);

  /* ---- Multi-modal passive collection ----------------------------- */

  useEffect(() => {
    let tickTimer = 0;

    function updateChannels() {
      const now = Date.now();
      if (now - tickTimer < 200) return;
      tickTimer = now;

      // Count stillness samples (micro-jitter) from recent data
      const recent = samplesRef.current.slice(-50);
      let tremorCount = 0;
      for (let i = 1; i < recent.length; i++) {
        const dx = recent[i].x - recent[i - 1].x;
        const dy = recent[i].y - recent[i - 1].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1 && dist <= 3) tremorCount++;
      }

      setChannels({
        motor: samplesRef.current.length,
        keystroke: keyEventsRef.current.length,
        scroll: scrollEventsRef.current.length,
        click: clickEventsRef.current.length,
        attention: tabSwitchRef.current,
        tremor: tremorCount,
      });
    }

    // Mouse / touch
    const addSample = (x: number, y: number) => {
      const last = samplesRef.current[samplesRef.current.length - 1];
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        if (dx * dx + dy * dy < 4) return; // < 2px threshold
      }
      samplesRef.current.push({ x, y, t: Date.now() });
      updateChannels();
    };

    const onMouse = (e: MouseEvent) => addSample(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) addSample(t.clientX, t.clientY); };

    // Keystroke dynamics
    const onKeyDown = (e: KeyboardEvent) => {
      if (!pendingKeyDown.current.has(e.code)) {
        pendingKeyDown.current.set(e.code, performance.now());
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const down = pendingKeyDown.current.get(e.code);
      if (down !== undefined) {
        keyEventsRef.current.push({ key: e.key, down, up: performance.now() });
        pendingKeyDown.current.delete(e.code);
        updateChannels();
      }
    };

    // Scroll dynamics
    const onWheel = (e: WheelEvent) => {
      scrollEventsRef.current.push({ t: performance.now(), deltaY: e.deltaY });
      updateChannels();
    };

    // Click dynamics (mousedown → mouseup duration)
    const onMouseDown = () => { pendingClickDown.current = performance.now(); };
    const onMouseUp = () => {
      if (pendingClickDown.current > 0) {
        clickEventsRef.current.push({ down: pendingClickDown.current, up: performance.now() });
        pendingClickDown.current = 0;
        updateChannels();
      }
    };

    // Attention / tab visibility
    const onVisibility = () => {
      if (document.hidden) { tabSwitchRef.current++; updateChannels(); }
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });
    window.addEventListener("keyup", onKeyUp, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  /* ---- Community count ---- */
  useEffect(() => {
    fetch("/api/contribute")
      .then((r) => r.json())
      .then((d: { totalContributions?: number }) => {
        if (typeof d.totalContributions === "number") setContributorCount(d.totalContributions);
      })
      .catch(() => {});
  }, []);

  /* ---- Calibration ---- */
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  /* ---- REVEAL ---- */
  const handleReveal = useCallback(() => {
    if (!ready) return;
    signalsRef.current = computeSignals(
      samplesRef.current,
      keyEventsRef.current,
      scrollEventsRef.current,
      clickEventsRef.current,
      tabSwitchRef.current,
      pageLoadRef.current,
    );
    setVizSamples([...samplesRef.current]);
    setPhase("analyzing");
    setStepIdx(0);
    setStepDetails([]);
    setError("");
    setResult(null);
    setDisplayDays(0);
    setBarsRevealed(false);
    setShow3D(false);
    setDeepScanResult(null);
    setDeepScanDone(false);
    setDeepScanning(false);
    setContributed(false);
  }, [ready]);

  /* ---- Analysis ---- */
  useEffect(() => {
    if (phase !== "analyzing" || !signalsRef.current) return;
    let cancelled = false;
    const s = signalsRef.current;

    async function run() {
      const details: string[] = [];
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        await new Promise<void>((r) => setTimeout(r, STEP_DELAYS[i]));
        if (cancelled) return;

        switch (i) {
          case 0:
            details.push(
              `${s.motor.dataPoints} pts | v\u0304=${s.motor.meanVelocity.toFixed(2)} | \u03C3=${s.motor.velocityStd.toFixed(2)} | jerk=${s.motor.meanJerk.toFixed(4)}`
            );
            break;
          case 1:
            details.push(
              s.keystroke.totalKeys > 0
                ? `${s.keystroke.totalKeys} keys | dwell=${s.keystroke.dwellMean.toFixed(0)}ms | flight=${s.keystroke.flightMean.toFixed(0)}ms | err=${(s.keystroke.errorRate * 100).toFixed(1)}%`
                : "no keystroke data — motor-only analysis"
            );
            break;
          case 2: {
            const hh = String(s.circadian.hour).padStart(2, "0");
            const mm = String(s.circadian.minute).padStart(2, "0");
            const tz = s.circadian.timezone.split("/").pop() || "";
            const dev = Math.abs(s.circadian.hour + s.circadian.minute / 60 - 12.5);
            details.push(`${hh}:${mm} ${tz} | \u0394opt=${dev > 0 ? "+" : ""}${dev.toFixed(1)}h`);
            break;
          }
          case 3:
            details.push(
              `${(s.interaction.timeOnPageMs / 1000).toFixed(1)}s | clicks=${s.interaction.clickCount} | click_dur=${s.interaction.meanClickDuration.toFixed(0)}ms`
            );
            break;
          case 4:
            details.push(
              `H=${s.motor.entropy.toFixed(2)} nats | skew=${s.motor.velocitySkew.toFixed(2)} | kurt=${s.motor.velocityKurtosis.toFixed(2)}`
            );
            break;
          case 5:
            details.push(
              `jitter=${s.motor.jitter.toFixed(3)}px | stillness_detected=${s.motor.silenceSegments}`
            );
            break;
          case 6:
            details.push(
              `${s.motor.movementSegments} movement | ${s.motor.silenceSegments} silence | ${s.scroll.reversals} scroll_rev`
            );
            break;
          case 7:
            details.push("projection complete");
            break;
        }
        setStepDetails([...details]);
        setStepIdx(i + 1);
      }

      if (cancelled) return;
      await new Promise<void>((r) => setTimeout(r, 500));
      if (cancelled) return;

      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d as { error?: string }).error || "Prediction failed");
        }
        const data: PredictionResult = await res.json();
        if (cancelled) return;
        setResult(data);
        setPhase("result");
        setBarsRevealed(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Analysis failed. Try again.");
        setPhase("idle");
      }
    }

    run();
    return () => { cancelled = true; };
  }, [phase]);

  /* ---- Days counter ---- */
  useEffect(() => {
    if (phase !== "result" || !result) return;
    const target = result.daysRemaining;
    let start: number | null = null;
    let raf: number;
    function tick(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 2200, 1);
      setDisplayDays(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    const timer = setTimeout(() => { raf = requestAnimationFrame(tick); }, 2800);
    return () => { clearTimeout(timer); if (raf) cancelAnimationFrame(raf); };
  }, [phase, result]);

  /* ---- 3D delay ---- */
  useEffect(() => {
    if (phase !== "result" || !result) return;
    const t = setTimeout(() => setShow3D(true), 4500);
    return () => clearTimeout(t);
  }, [phase, result]);

  /* ---- Deep Scan ---- */
  const handleDeepScan = useCallback(async () => {
    if (deepScanning || deepScanDone) return;
    setDeepScanning(true);
    try {
      const scan = await performDeepScan();
      setDeepScanResult(scan);
      setDeepScanDone(true);
      let extra = 0;
      if (scan.battery) extra++;
      if (scan.memory) extra++;
      if (scan.cores) extra++;
      if (scan.connection) extra++;
      if (scan.storage) extra++;
      if (scan.timing) extra++;
      extra += scan.sensors.length;
      if (result && extra > 0) {
        setResult({ ...result, confidence: Math.min(result.confidence + Math.min(extra * 0.008, 0.05), 0.98) });
      }
    } catch { /* */ }
    setDeepScanning(false);
  }, [deepScanning, deepScanDone, result]);

  /* ---- Contribute ---- */
  const handleContribute = useCallback(async () => {
    if (contributing || contributed || !result) return;
    setContributing(true);
    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskLevel: result.overallRisk,
          bioAge: result.estimatedBioAge,
          entropy: result.signalSummary.entropy,
          curvatureIQR: result.signalSummary.curvatureIQR,
          velocityStd: result.signalSummary.velocityStd,
          circadianDev: result.signalSummary.circadianDev,
          deepScan: deepScanDone,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { totalContributions?: number };
        setContributed(true);
        if (typeof data.totalContributions === "number") setContributorCount(data.totalContributions);
      }
    } catch { /* */ }
    setContributing(false);
  }, [contributing, contributed, result, deepScanDone]);

  /* ---- Reset ---- */
  const reset = () => {
    setPhase("idle");
    setResult(null);
    setError("");
    setDisplayDays(0);
    setBarsRevealed(false);
    setStepDetails([]);
    setVizSamples([]);
    setShow3D(false);
    setDeepScanResult(null);
    setDeepScanDone(false);
    setContributed(false);
  };

  /* ---- Active channels count ---- */
  const activeChannels = [
    channels.motor > 0,
    channels.keystroke > 0,
    channels.scroll > 0,
    channels.click > 0,
    channels.tremor > 0,
  ].filter(Boolean).length;

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <main className="grain vignette min-h-screen relative overflow-hidden">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className={`w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full blur-[160px] transition-all duration-[5000ms] ${
          phase === "result" ? "bg-ember/[0.05]" : phase === "analyzing" ? "bg-ember/[0.03]" : "bg-ember/[0.012]"
        }`} />
      </div>

      {phase === "idle" && <LiveCanvas samplesRef={samplesRef} />}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        {/* ============================================================ */}
        {/*  IDLE                                                         */}
        {/* ============================================================ */}
        {phase === "idle" && (
          <div className="flex flex-col items-center w-full max-w-md anim-fade-in">
            <h1 className="font-display font-bold text-[20vw] md:text-[13vw] leading-[0.82] tracking-[-0.03em] text-bone select-none">
              WHEN
            </h1>
            <div className="w-14 h-px bg-ember mt-7 mb-10" />

            {/* Multi-channel monitoring status */}
            <div className="w-full max-w-xs mb-10">
              <div className="flex items-center gap-2 mb-5 justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse" />
                <span className="font-mono text-[10px] text-ember/50 tracking-[0.3em] uppercase">
                  {activeChannels}/6 channels active
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: "Motor Control", value: channels.motor, unit: "pts", active: channels.motor > 0 },
                  { label: "Keystroke Dynamics", value: channels.keystroke, unit: "keys", active: channels.keystroke > 0 },
                  { label: "Scroll Behavior", value: channels.scroll, unit: "events", active: channels.scroll > 0 },
                  { label: "Click Patterns", value: channels.click, unit: "clicks", active: channels.click > 0 },
                  { label: "Micro-Tremor", value: channels.tremor, unit: "samples", active: channels.tremor > 0 },
                  { label: "Attention State", value: channels.attention, unit: "switches", active: true },
                ].map((ch) => (
                  <div key={ch.label} className="flex items-center justify-between font-mono text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-1 rounded-full transition-all duration-500 ${
                        ch.active && ch.value > 0 ? "bg-ember" : "bg-[#222]"
                      }`} />
                      <span className={`transition-colors duration-500 ${
                        ch.active && ch.value > 0 ? "text-bone/40" : "text-[#1a1a1a]"
                      }`}>
                        {ch.label}
                      </span>
                    </div>
                    <span className={`tabular-nums transition-colors duration-500 ${
                      ch.active && ch.value > 0 ? "text-ember/40" : "text-[#1a1a1a]"
                    }`}>
                      {ch.value > 0 ? `${ch.value} ${ch.unit}` : "waiting"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* THE BUTTON */}
            <button
              onClick={handleReveal}
              disabled={!ready}
              className="group relative py-4 px-16 font-mono text-[11px] tracking-[0.3em] uppercase border border-ash text-bone/40 hover:border-ember hover:text-ember disabled:opacity-[0.1] disabled:cursor-not-allowed transition-all duration-500 active:scale-[0.97]"
            >
              <span className="relative z-10">{ready ? "Reveal" : "Calibrating\u2026"}</span>
              <div className="absolute inset-0 bg-ember/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>

            {contributorCount !== null && contributorCount > 0 && (
              <div className="mt-6 font-mono text-[10px] text-[#2a2a2a] tracking-[0.15em]">
                {contributorCount.toLocaleString()} phenotypes contributed
              </div>
            )}

            {error && <p className="mt-8 text-blood font-mono text-sm anim-fade-in">{error}</p>}

            <p className="mt-16 text-[#1a1a1a] font-mono text-[10px] text-center leading-relaxed max-w-xs select-none">
              Multi-modal behavioral phenotyping. Motor control, keystroke
              dynamics, scroll patterns, click precision, micro-tremor, attention
              state. No data stored beyond this session.
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/*  ANALYZING                                                     */}
        {/* ============================================================ */}
        {phase === "analyzing" && (
          <div className="flex flex-col items-center w-full max-w-lg anim-fade-in">
            <h2 className="font-display font-bold text-5xl md:text-6xl text-bone tracking-[-0.02em] select-none mb-14">WHEN</h2>
            <div className="w-full h-px bg-ash/40 mb-14 relative overflow-hidden">
              <div className="absolute h-full w-20 bg-gradient-to-r from-transparent via-ember/80 to-transparent anim-scan" />
            </div>

            <div className="w-full space-y-5">
              {STEPS.map((step, i) => (
                <div key={i}>
                  <div className={`flex items-center gap-4 font-mono text-sm transition-all duration-500 ${
                    i < stepIdx ? "text-ember/70" : i === stepIdx ? "text-bone" : "text-[#181818]"
                  }`}>
                    <span className="w-3 shrink-0 text-center text-xs">
                      {i < stepIdx ? "\u2713" : i === stepIdx ? "\u203A" : "\u00B7"}
                    </span>
                    <span className="truncate">{step}</span>
                    {i === stepIdx && <span className="ml-auto text-ember animate-pulse shrink-0 text-xs">...</span>}
                  </div>
                  {stepDetails[i] && (
                    <div className="ml-7 mt-1 font-mono text-[10px] text-[#444] anim-fade-in">{stepDetails[i]}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="w-full mt-14 relative">
              <div className="h-px bg-ash/30 w-full" />
              <div className="h-px bg-ember absolute top-0 left-0 transition-all duration-700 ease-out" style={{ width: `${(stepIdx / STEPS.length) * 100}%` }} />
            </div>
            <p className="mt-6 font-mono text-[10px] text-[#333] tracking-[0.2em]">
              {Math.round((stepIdx / STEPS.length) * 100)}% COMPLETE
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/*  RESULT                                                        */}
        {/* ============================================================ */}
        {phase === "result" && result && (
          <div className="flex flex-col items-center w-full max-w-xl">
            <div className="text-center mb-10 opacity-0 anim-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="font-mono text-[10px] text-[#333] tracking-[0.2em]">
                ANALYSIS #{result.analysisId} &middot; {result.signalChannels} SIGNAL CHANNELS
              </div>
              <div className="font-mono text-[10px] text-[#2a2a2a] tracking-[0.15em] mt-1">
                ESTIMATED BIOLOGICAL AGE: {result.estimatedBioAge}
              </div>
            </div>

            <div className="font-display font-bold text-[7.5vw] sm:text-4xl md:text-[3.2rem] tracking-[0.04em] text-center leading-tight mb-6">
              {formatDate(result.predictedDate).split("").map((ch, i) => (
                <span key={i} className="inline-block opacity-0 anim-char-reveal" style={{ animationDelay: `${0.4 + i * 0.055}s` }}>
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </div>

            <div className="text-center opacity-0 anim-fade-in" style={{ animationDelay: "2.8s" }}>
              <div className="font-mono text-2xl md:text-3xl text-ember tabular-nums">{displayDays.toLocaleString()}</div>
              <div className="font-mono text-[10px] text-[#444] tracking-[0.3em] mt-1">DAYS REMAINING</div>
            </div>

            <div className="w-full my-12 opacity-0 anim-fade-in" style={{ animationDelay: "3.2s" }}>
              <div className="h-px bg-blood/50 anim-flatline" />
            </div>

            {/* Signal summary — expanded */}
            <div className="w-full grid grid-cols-3 sm:grid-cols-5 gap-4 mb-10 opacity-0 anim-fade-in" style={{ animationDelay: "3.4s" }}>
              {[
                { label: "DATA PTS", value: result.signalSummary.dataPoints.toLocaleString() },
                { label: "ENTROPY", value: result.signalSummary.entropy.toFixed(2) },
                { label: "\u03C3 VELOCITY", value: result.signalSummary.velocityStd.toFixed(2) },
                { label: "JITTER", value: result.signalSummary.jitter.toFixed(3) },
                { label: "JERK", value: result.signalSummary.jerkMean.toFixed(4) },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="font-mono text-xs text-ember/70 tabular-nums">{item.value}</div>
                  <div className="font-mono text-[9px] text-[#333] tracking-wider mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            {/* 3D Visualization — contained */}
            {show3D && vizSamples.length > 2 && (
              <div className="w-full opacity-0 anim-fade-in" style={{ animationDelay: "0.2s", animationDuration: "1.5s" }}>
                <div className="font-mono text-[10px] text-[#333] tracking-[0.3em] mb-4">YOUR BEHAVIORAL SIGNATURE</div>
                <div className="relative w-full aspect-[16/10] border border-ash/20 rounded-sm overflow-hidden bg-[#030303]">
                  <RiskVisualization3D samples={vizSamples} riskFactors={result.riskFactors} />
                  <div className="absolute top-3 left-3 font-mono text-[8px] text-[#333] tracking-wider pointer-events-none">{vizSamples.length} DATA POINTS</div>
                  <div className="absolute top-3 right-3 font-mono text-[8px] text-[#333] tracking-wider pointer-events-none">DRAG TO ROTATE</div>
                  <div className="absolute bottom-3 left-3 font-mono text-[8px] text-[#333] tracking-wider pointer-events-none">X: POSITION &middot; Y: TIME &middot; Z: DEPTH</div>
                  <div className="absolute bottom-3 right-3 font-mono text-[8px] text-ember/30 tracking-wider pointer-events-none">VELOCITY HEATMAP</div>
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            <div className="w-full mt-12 opacity-0 anim-fade-in" style={{ animationDelay: show3D ? "0.5s" : "3.6s" }}>
              <h3 className="font-mono text-[10px] text-[#444] tracking-[0.3em] mb-8">RISK ASSESSMENT</h3>
              <div className="space-y-5">
                {result.riskFactors.map((f, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-mono text-xs text-bone/60">{f.label}</span>
                      <span className="font-mono text-xs text-ember/70 tabular-nums">{f.score}%</span>
                    </div>
                    <div className="h-[3px] bg-ash/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-[1200ms] ease-out" style={{
                        width: barsRevealed ? `${f.score}%` : "0%",
                        transitionDelay: `${3.8 + i * 0.2}s`,
                        backgroundColor: barColor(f.score),
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-10 pt-8 border-t border-ash/30">
                <div>
                  <span className="font-mono text-[10px] text-[#444] tracking-wider">RISK LEVEL </span>
                  <span className={`font-mono text-xs font-bold tracking-wider ${riskColor(result.overallRisk)}`}>{result.overallRisk}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#444] tracking-wider">CONFIDENCE </span>
                  <span className="font-mono text-xs text-ember tabular-nums">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full mt-14 pt-10 border-t border-ash/20 opacity-0 anim-fade-in" style={{ animationDelay: "5s" }}>
              <div className="flex flex-col sm:flex-row gap-4">
                {!deepScanDone ? (
                  <button onClick={handleDeepScan} disabled={deepScanning}
                    className="group flex-1 relative py-3.5 px-6 font-mono text-[10px] tracking-[0.2em] uppercase border border-ember/30 text-ember/60 hover:border-ember hover:text-ember disabled:opacity-50 transition-all duration-500 active:scale-[0.98]">
                    <span className="relative z-10">{deepScanning ? "Scanning\u2026" : "Enhance Prediction"}</span>
                    <div className="absolute inset-0 bg-ember/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </button>
                ) : (
                  <div className="flex-1 py-3.5 px-6 border border-ember/20 text-center">
                    <div className="font-mono text-[10px] text-ember/50 tracking-[0.2em] uppercase">Enhanced</div>
                    <div className="font-mono text-[9px] text-[#333] mt-1">
                      +{deepScanResult ? [deepScanResult.battery && "battery", deepScanResult.memory && "memory", deepScanResult.cores && "cores", deepScanResult.connection && "network", deepScanResult.storage && "storage", deepScanResult.timing && "timing", ...deepScanResult.sensors].filter(Boolean).join(", ") : "0"}
                    </div>
                  </div>
                )}

                {!contributed ? (
                  <button onClick={handleContribute} disabled={contributing}
                    className="group flex-1 relative py-3.5 px-6 font-mono text-[10px] tracking-[0.2em] uppercase border border-ash/40 text-bone/30 hover:border-bone/40 hover:text-bone/50 disabled:opacity-50 transition-all duration-500 active:scale-[0.98]">
                    <span className="relative z-10">{contributing ? "Contributing\u2026" : "Contribute to Research"}</span>
                    <div className="absolute inset-0 bg-bone/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </button>
                ) : (
                  <div className="flex-1 py-3.5 px-6 border border-ash/20 text-center">
                    <div className="font-mono text-[10px] text-bone/30 tracking-[0.2em] uppercase">Contributed</div>
                    {contributorCount !== null && <div className="font-mono text-[9px] text-[#333] mt-1">{contributorCount.toLocaleString()} total</div>}
                  </div>
                )}
              </div>

              {!deepScanDone && (
                <p className="mt-4 font-mono text-[9px] text-[#222] leading-relaxed">
                  Enhance: battery, memory, CPU cores, network, storage, timing, sensors. All local. Nothing leaves your browser.
                </p>
              )}

              {deepScanDone && deepScanResult && (
                <div className="mt-4 space-y-1.5 anim-fade-in">
                  {deepScanResult.battery && <div className="font-mono text-[9px] text-[#333]">Battery: {Math.round(deepScanResult.battery.level * 100)}% {deepScanResult.battery.charging ? "(charging)" : "(discharging)"}</div>}
                  {deepScanResult.cores && <div className="font-mono text-[9px] text-[#333]">Cores: {deepScanResult.cores}</div>}
                  {deepScanResult.memory && <div className="font-mono text-[9px] text-[#333]">Memory: {deepScanResult.memory}GB</div>}
                  {deepScanResult.connection && <div className="font-mono text-[9px] text-[#333]">Network: {deepScanResult.connection.type} | {deepScanResult.connection.downlink}Mbps | {deepScanResult.connection.rtt}ms</div>}
                  {deepScanResult.timing && <div className="font-mono text-[9px] text-[#333]">Load: {deepScanResult.timing.domLoad}ms DOM | {deepScanResult.timing.fullLoad}ms total</div>}
                </div>
              )}

              {!contributed && (
                <p className="mt-3 font-mono text-[9px] text-[#222] leading-relaxed">
                  Contribute: anonymized scores only. No mouse data, no fingerprint, no PII.
                </p>
              )}
            </div>

            <button onClick={reset}
              className="mt-14 py-3 px-10 font-mono text-[10px] tracking-[0.3em] uppercase border border-ash/40 text-bone/30 hover:border-ember hover:text-ember transition-all duration-300 active:scale-[0.98] opacity-0 anim-fade-in"
              style={{ animationDelay: "5.5s" }}>
              Analyze Again
            </button>

            <p className="mt-12 text-[#1a1a1a] font-mono text-[10px] text-center leading-relaxed max-w-xs select-none opacity-0 anim-fade-in" style={{ animationDelay: "5.5s" }}>
              For entertainment purposes only. Multi-modal behavioral phenotyping.
              No data stored. Does not constitute medical advice.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
