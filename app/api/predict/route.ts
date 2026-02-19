import { NextRequest, NextResponse } from "next/server";
import { predict } from "@/lib/predictor";

/* ------------------------------------------------------------------ */
/*  In-memory rate limiter (single-process; swap for Redis in prod)   */
/* ------------------------------------------------------------------ */

const WINDOW_MS = 60_000; // 1 minute
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

// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  hits.forEach((entry, ip) => {
    if (now > entry.reset) hits.delete(ip);
  });
}, WINDOW_MS * 5);

/* ------------------------------------------------------------------ */
/*  POST /api/predict                                                  */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  // --- Rate limit ------------------------------------------------- //
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  // --- Parse & validate ------------------------------------------- //
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, birthYear } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "A non-empty name is required." },
      { status: 400 }
    );
  }

  const sanitizedName = name.trim().slice(0, 100);

  let parsedYear: number | undefined;
  if (birthYear !== undefined && birthYear !== null && birthYear !== "") {
    parsedYear = Number(birthYear);
    const currentYear = new Date().getFullYear();
    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1900 ||
      parsedYear > currentYear
    ) {
      return NextResponse.json(
        { error: "Birth year must be between 1900 and the current year." },
        { status: 400 }
      );
    }
  }

  // --- Predict ---------------------------------------------------- //
  const result = predict(sanitizedName, parsedYear);

  return NextResponse.json(result);
}
