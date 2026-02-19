export interface RiskFactor {
  label: string;
  score: number;
  description: string;
}

export interface PredictionResult {
  predictedDate: string;
  confidence: number;
  daysRemaining: number;
  riskFactors: RiskFactor[];
  overallRisk: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  analysisId: string;
}

/**
 * Deterministic hash function (djb2 variant).
 * Produces a consistent numeric seed from any string input.
 */
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

/**
 * Seeded linear congruential generator.
 * Returns a function that produces deterministic floats in [0, 1).
 */
function seededRng(seed: number) {
  let state = seed;
  return (): number => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

/**
 * Generate a mortality prediction from the given input.
 *
 * This is an entertainment algorithm — it uses a deterministic PRNG
 * seeded by the input name to produce consistent, realistic-looking
 * results. No real health data is used or stored.
 */
export function predict(name: string, birthYear?: number): PredictionResult {
  const seed = hash(name.toLowerCase().trim());
  const rng = seededRng(seed);

  const currentYear = new Date().getFullYear();
  const resolvedBirthYear =
    birthYear ?? currentYear - Math.floor(25 + rng() * 40);
  const currentAge = currentYear - resolvedBirthYear;

  // Base life expectancy with variance
  const baseExpectancy = 72 + rng() * 20;

  // "Analysis" modifiers from different prediction models
  const searchMod = (rng() - 0.5) * 8;
  const ehrMod = (rng() - 0.5) * 6;
  const behaviorMod = (rng() - 0.5) * 10;
  const lifevecMod = (rng() - 0.5) * 5;
  const temporalMod = (rng() - 0.5) * 4;

  const predictedAge = Math.max(
    currentAge + 2,
    Math.round(
      baseExpectancy + searchMod + ehrMod + behaviorMod + lifevecMod + temporalMod
    )
  );

  const predictedYear = resolvedBirthYear + predictedAge;
  const predictedMonth = Math.floor(rng() * 12);
  const predictedDay = 1 + Math.floor(rng() * 28);
  const predictedDate = new Date(predictedYear, predictedMonth, predictedDay);

  const now = new Date();
  const daysRemaining = Math.max(
    1,
    Math.floor(
      (predictedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const riskFactors: RiskFactor[] = [
    {
      label: "Search Pattern Deviation",
      score: Math.round(12 + rng() * 72),
      description:
        "Behavioral divergence from baseline search activity patterns",
    },
    {
      label: "EHR Mortality Correlation",
      score: Math.round(8 + rng() * 62),
      description:
        "Statistical correlation with electronic health record mortality indicators",
    },
    {
      label: "Behavioral Shift Index",
      score: Math.round(15 + rng() * 68),
      description: "Magnitude of recent behavioral pattern changes",
    },
    {
      label: "Life2Vec Embedding Score",
      score: Math.round(10 + rng() * 58),
      description: "Deep learning life-sequence prediction model output",
    },
    {
      label: "Temporal Anomaly Index",
      score: Math.round(5 + rng() * 78),
      description: "Time-series deviation in digital activity patterns",
    },
  ];

  const avgScore =
    riskFactors.reduce((sum, f) => sum + f.score, 0) / riskFactors.length;

  const overallRisk: PredictionResult["overallRisk"] =
    avgScore < 25
      ? "LOW"
      : avgScore < 40
        ? "MODERATE"
        : avgScore < 55
          ? "ELEVATED"
          : avgScore < 70
            ? "HIGH"
            : "CRITICAL";

  const confidence = 0.847 + rng() * 0.102; // 84.7%–94.9%

  const analysisId = seed.toString(16).toUpperCase().padStart(8, "0");

  return {
    predictedDate: predictedDate.toISOString().split("T")[0],
    confidence,
    daysRemaining,
    riskFactors,
    overallRisk,
    analysisId,
  };
}
