import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Anonymous Community Contribution Endpoint                          */
/*                                                                     */
/*  Accepts anonymized behavioral signal summaries. No PII is stored.  */
/*  In-memory store — swap for a real DB in production.                 */
/* ------------------------------------------------------------------ */

interface ContributionEntry {
  id: string;
  timestamp: number;
  signalHash: string;
  riskLevel: string;
  bioAge: number;
  entropy: number;
  curvatureIQR: number;
  velocityStd: number;
  circadianDev: number;
  deepScan: boolean;
}

// In-memory store (ephemeral — resets on server restart)
const contributions: ContributionEntry[] = [];
const MAX_CONTRIBUTIONS = 10_000;

// Rate limit: 2 contributions per IP per 5 minutes
const CONTRIB_WINDOW = 300_000;
const CONTRIB_MAX = 2;
const contribHits = new Map<string, { count: number; reset: number }>();

function isContribLimited(ip: string): boolean {
  const now = Date.now();
  const entry = contribHits.get(ip);
  if (!entry || now > entry.reset) {
    contribHits.set(ip, { count: 1, reset: now + CONTRIB_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > CONTRIB_MAX;
}

function hashValue(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/* ------------------------------------------------------------------ */
/*  POST /api/contribute                                               */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  if (isContribLimited(ip)) {
    return NextResponse.json(
      { error: "Contribution rate limit. Try again later." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Validate required fields
  if (
    typeof body.riskLevel !== "string" ||
    !isNumber(body.bioAge) ||
    !isNumber(body.entropy) ||
    !isNumber(body.curvatureIQR) ||
    !isNumber(body.velocityStd) ||
    !isNumber(body.circadianDev)
  ) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  // Create anonymized entry
  const signalHash = hashValue(
    `${body.bioAge}-${body.entropy}-${body.curvatureIQR}-${body.velocityStd}-${ip}`
  );

  const entry: ContributionEntry = {
    id: hashValue(`${Date.now()}-${Math.random()}-${signalHash}`),
    timestamp: Date.now(),
    signalHash,
    riskLevel: String(body.riskLevel).slice(0, 10),
    bioAge: Math.round(Number(body.bioAge)),
    entropy: Number(body.entropy),
    curvatureIQR: Number(body.curvatureIQR),
    velocityStd: Number(body.velocityStd),
    circadianDev: Number(body.circadianDev),
    deepScan: body.deepScan === true,
  };

  // Prevent unbounded growth
  if (contributions.length >= MAX_CONTRIBUTIONS) {
    contributions.shift();
  }
  contributions.push(entry);

  return NextResponse.json({
    contributorId: entry.id,
    totalContributions: contributions.length,
    message: "Thank you. Your anonymous signal data has been contributed.",
  });
}

/* ------------------------------------------------------------------ */
/*  GET /api/contribute — returns aggregate stats only                 */
/* ------------------------------------------------------------------ */

export async function GET() {
  const total = contributions.length;
  if (total === 0) {
    return NextResponse.json({
      totalContributions: 0,
      avgBioAge: null,
      avgEntropy: null,
      riskDistribution: {},
    });
  }

  const avgBioAge =
    contributions.reduce((s, c) => s + c.bioAge, 0) / total;
  const avgEntropy =
    contributions.reduce((s, c) => s + c.entropy, 0) / total;

  const riskDist: Record<string, number> = {};
  for (const c of contributions) {
    riskDist[c.riskLevel] = (riskDist[c.riskLevel] || 0) + 1;
  }

  return NextResponse.json({
    totalContributions: total,
    avgBioAge: Math.round(avgBioAge),
    avgEntropy: +avgEntropy.toFixed(2),
    riskDistribution: riskDist,
    deepScanCount: contributions.filter((c) => c.deepScan).length,
  });
}
