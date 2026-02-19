import { NextRequest, NextResponse } from "next/server";
import { predict } from "@/lib/predictor";
import type { BehavioralSignals } from "@/lib/predictor";

/* ------------------------------------------------------------------ */
/*  Rate limiter (in-memory; swap for Redis in production)             */
/* ------------------------------------------------------------------ */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const hits = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

function purgeStaleEntries() {
  const now = Date.now();
  hits.forEach((entry, ip) => {
    if (now > entry.reset) hits.delete(ip);
  });
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function validateSignals(body: unknown): BehavioralSignals | null {
  if (typeof body !== "object" || body === null) return null;

  const b = body as Record<string, unknown>;

  // Motor signals
  const m = b.motor as Record<string, unknown> | undefined;
  if (!m || typeof m !== "object") return null;
  if (
    !isNumber(m.meanVelocity) ||
    !isNumber(m.velocityStd) ||
    !isNumber(m.velocitySkew) ||
    !isNumber(m.velocityKurtosis) ||
    !isNumber(m.meanAcceleration) ||
    !isNumber(m.accelerationStd) ||
    !isNumber(m.meanJerk) ||
    !isNumber(m.curvatureRatioMean) ||
    !isNumber(m.curvatureRatioIQR) ||
    !isNumber(m.idleTimeIQR) ||
    !isNumber(m.entropy) ||
    !isNumber(m.jitter) ||
    !isNumber(m.dataPoints) ||
    !isNumber(m.movementSegments) ||
    !isNumber(m.silenceSegments)
  )
    return null;

  // Keystroke signals
  const k = b.keystroke as Record<string, unknown> | undefined;
  if (!k || typeof k !== "object") return null;
  if (
    !isNumber(k.dwellMean) ||
    !isNumber(k.dwellStd) ||
    !isNumber(k.flightMean) ||
    !isNumber(k.flightStd) ||
    !isNumber(k.totalKeys) ||
    !isNumber(k.errorRate)
  )
    return null;

  // Scroll signals
  const sc = b.scroll as Record<string, unknown> | undefined;
  if (!sc || typeof sc !== "object") return null;
  if (
    !isNumber(sc.velocityMean) ||
    !isNumber(sc.velocityStd) ||
    !isNumber(sc.reversals) ||
    !isNumber(sc.totalEvents)
  )
    return null;

  // Circadian
  const c = b.circadian as Record<string, unknown> | undefined;
  if (!c || typeof c !== "object") return null;
  if (
    !isNumber(c.hour) ||
    !isNumber(c.minute) ||
    !isNumber(c.dayOfWeek) ||
    typeof c.timezone !== "string"
  )
    return null;

  // Interaction
  const i = b.interaction as Record<string, unknown> | undefined;
  if (!i || typeof i !== "object") return null;
  if (
    !isNumber(i.timeOnPageMs) ||
    !isNumber(i.scrollEvents) ||
    !isNumber(i.tabSwitches) ||
    !isNumber(i.totalIdleMs) ||
    !isNumber(i.clickCount) ||
    !isNumber(i.meanClickDuration)
  )
    return null;

  // Device
  const d = b.device as Record<string, unknown> | undefined;
  if (!d || typeof d !== "object") return null;
  if (
    !isNumber(d.screenWidth) ||
    !isNumber(d.screenHeight) ||
    !isNumber(d.pixelRatio) ||
    typeof d.touchCapable !== "boolean" ||
    typeof d.colorScheme !== "string" ||
    typeof d.language !== "string" ||
    typeof d.platform !== "string"
  )
    return null;

  return {
    motor: {
      meanVelocity: m.meanVelocity as number,
      velocityStd: m.velocityStd as number,
      velocitySkew: m.velocitySkew as number,
      velocityKurtosis: m.velocityKurtosis as number,
      meanAcceleration: m.meanAcceleration as number,
      accelerationStd: m.accelerationStd as number,
      meanJerk: m.meanJerk as number,
      curvatureRatioMean: m.curvatureRatioMean as number,
      curvatureRatioIQR: m.curvatureRatioIQR as number,
      idleTimeIQR: m.idleTimeIQR as number,
      entropy: m.entropy as number,
      jitter: m.jitter as number,
      dataPoints: Math.min(m.dataPoints as number, 100000),
      movementSegments: m.movementSegments as number,
      silenceSegments: m.silenceSegments as number,
    },
    keystroke: {
      dwellMean: k.dwellMean as number,
      dwellStd: k.dwellStd as number,
      flightMean: k.flightMean as number,
      flightStd: k.flightStd as number,
      totalKeys: Math.min(k.totalKeys as number, 10000),
      errorRate: k.errorRate as number,
    },
    scroll: {
      velocityMean: sc.velocityMean as number,
      velocityStd: sc.velocityStd as number,
      reversals: sc.reversals as number,
      totalEvents: Math.min(sc.totalEvents as number, 10000),
    },
    circadian: {
      hour: Math.floor(c.hour as number) % 24,
      minute: Math.floor(c.minute as number) % 60,
      dayOfWeek: Math.floor(c.dayOfWeek as number) % 7,
      timezone: (c.timezone as string).slice(0, 50),
    },
    interaction: {
      timeOnPageMs: Math.min(i.timeOnPageMs as number, 600_000),
      scrollEvents: Math.min(i.scrollEvents as number, 10000),
      tabSwitches: i.tabSwitches as number,
      totalIdleMs: i.totalIdleMs as number,
      clickCount: i.clickCount as number,
      meanClickDuration: i.meanClickDuration as number,
    },
    device: {
      screenWidth: d.screenWidth as number,
      screenHeight: d.screenHeight as number,
      pixelRatio: d.pixelRatio as number,
      touchCapable: d.touchCapable as boolean,
      colorScheme: (d.colorScheme as string).slice(0, 10),
      language: (d.language as string).slice(0, 10),
      platform: (d.platform as string).slice(0, 30),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  POST /api/predict                                                  */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  purgeStaleEntries();

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const signals = validateSignals(body);
  if (!signals) {
    return NextResponse.json(
      { error: "Invalid behavioral signal payload." },
      { status: 400 }
    );
  }

  const result = predict(signals);
  return NextResponse.json(result);
}
