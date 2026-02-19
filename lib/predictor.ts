/**
 * WHEN — Behavioral Mortality Prediction Engine
 *
 * Multi-modal digital phenotyping with enterprise-grade feature engineering.
 * Based on validated biomarkers from published research:
 *
 * - Mouse curvature variability (IQR_K) — Seelye et al., PMC4748737
 * - Jerk (3rd derivative) — motor control degradation marker
 * - Micro-jitter / hand tremor — Nature Digital Medicine, 2019
 * - Keystroke dynamics (dwell, flight) — CMU benchmark, EER 0.45%
 * - Reaction time as mortality predictor — NHANES-III, PMC3906008
 * - RT variability (IIVRT) > mean RT — Sydney Memory & Ageing Study
 * - Circadian disruption and health — AHA scientific statement
 * - Scroll dynamics — Antal & Bokor, 2015
 * - Cognitive load via hesitation — BioCatch patent US20140317028A1
 * - Action segmentation — ACM Computing Surveys, 2024
 *
 * ENTERTAINMENT ONLY. No real health data is used or stored.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MotorSignals {
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
}

export interface KeystrokeSignals {
  dwellMean: number;
  dwellStd: number;
  flightMean: number;
  flightStd: number;
  totalKeys: number;
  errorRate: number;
}

export interface ScrollSignals {
  velocityMean: number;
  velocityStd: number;
  reversals: number;
  totalEvents: number;
}

export interface CircadianSignals {
  hour: number;
  minute: number;
  dayOfWeek: number;
  timezone: string;
}

export interface InteractionSignals {
  timeOnPageMs: number;
  scrollEvents: number;
  tabSwitches: number;
  totalIdleMs: number;
  clickCount: number;
  meanClickDuration: number;
}

export interface DeviceSignals {
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  touchCapable: boolean;
  colorScheme: string;
  language: string;
  platform: string;
}

export interface BehavioralSignals {
  motor: MotorSignals;
  keystroke: KeystrokeSignals;
  scroll: ScrollSignals;
  circadian: CircadianSignals;
  interaction: InteractionSignals;
  device: DeviceSignals;
}

export interface RiskFactor {
  label: string;
  score: number;
  description: string;
}

export interface PredictionResult {
  predictedDate: string;
  confidence: number;
  daysRemaining: number;
  estimatedBioAge: number;
  riskFactors: RiskFactor[];
  overallRisk: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
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

/* ------------------------------------------------------------------ */
/*  Internals                                                          */
/* ------------------------------------------------------------------ */

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

function seededRng(seed: number) {
  let state = seed;
  return (): number => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Count active signal channels — more channels = higher confidence */
function countChannels(s: BehavioralSignals): number {
  let ch = 0;
  if (s.motor.dataPoints > 5) ch++;            // mouse movement
  if (s.keystroke.totalKeys > 0) ch++;          // keystroke dynamics
  if (s.scroll.totalEvents > 0) ch++;           // scroll behavior
  if (s.interaction.clickCount > 0) ch++;       // click patterns
  if (s.interaction.tabSwitches >= 0) ch++;     // attention tracking
  if (s.motor.jitter > 0) ch++;                 // tremor detection
  if (s.motor.meanJerk !== 0) ch++;             // 3rd derivative
  if (s.motor.silenceSegments > 0) ch++;        // action segmentation
  return ch;
}

/**
 * Estimate biological age from multi-modal digital phenotype signals.
 *
 * Based on research showing:
 * - Mouse velocity decreases with age (Seelye et al.)
 * - Curvature variability increases with cognitive decline
 * - Higher jerk = less smooth motor control = older
 * - Micro-jitter increases with tremor / neurodegeneration
 * - Keystroke dwell time increases with age (CMU dataset)
 * - Late-night device usage skews younger
 * - Touch-primary users skew younger
 */
function estimateBioAge(s: BehavioralSignals, rng: () => number): number {
  let age = 32 + rng() * 30; // base 32-62

  // Motor control — velocity degrades with age
  if (s.motor.meanVelocity > 0.7) age -= 5;
  else if (s.motor.meanVelocity < 0.25) age += 7;

  // High curvature variability → older (MCI marker, IQR_K)
  if (s.motor.curvatureRatioIQR > 0.18) age += 4;

  // High velocity variability → older (IIVRT research)
  if (s.motor.velocityStd > 0.6) age += 3;

  // High jerk → less smooth motor output → older
  if (s.motor.meanJerk > 0.005) age += 3;
  else if (s.motor.meanJerk < 0.001 && s.motor.meanJerk > 0) age -= 2;

  // Micro-jitter → hand tremor → neurodegeneration marker
  if (s.motor.jitter > 2.0) age += 5;
  else if (s.motor.jitter > 1.0) age += 2;

  // Negative kurtosis → platykurtic velocity distribution → less peak control
  if (s.motor.velocityKurtosis < -0.5) age += 2;

  // Keystroke dynamics — slower dwell = older (research-backed)
  if (s.keystroke.totalKeys > 3) {
    if (s.keystroke.dwellMean > 150) age += 4;
    else if (s.keystroke.dwellMean < 80) age -= 3;
    // Higher variability in flight time = cognitive decline
    if (s.keystroke.flightStd > 100) age += 2;
  }

  // Scroll behavior — fewer reversals = more deliberate = older
  if (s.scroll.totalEvents > 3) {
    if (s.scroll.reversals === 0) age += 2;
    if (s.scroll.velocityStd > 500) age -= 1; // highly variable = younger
  }

  // Late-night usage → younger
  const h = s.circadian.hour;
  if (h >= 23 || h < 5) age -= 7;
  else if (h >= 6 && h < 9) age += 3;

  // Touch device → younger
  if (s.device.touchCapable) age -= 3;

  // High DPI → newer device → younger
  if (s.device.pixelRatio >= 2) age -= 2;

  // Dark mode → younger
  if (s.device.colorScheme === "dark") age -= 1;

  // Tab switching → multitasking → younger
  if (s.interaction.tabSwitches > 2) age -= 2;

  return Math.round(clamp(age, 18, 88));
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function predict(signals: BehavioralSignals): PredictionResult {
  const deviceStr = [
    signals.device.screenWidth,
    signals.device.screenHeight,
    signals.device.pixelRatio,
    signals.device.platform,
    signals.device.language,
  ].join("|");
  const seed = hash(deviceStr);
  const rng = seededRng(seed);

  const bioAge = estimateBioAge(signals, rng);
  const channels = countChannels(signals);

  // ---- Risk factor scores ---------------------------------------- //

  // 1. Motor Control Deviation — curvature IQR + jerk + jitter
  const motorNorm = clamp(signals.motor.curvatureRatioIQR / 0.3, 0, 1);
  const jerkNorm = clamp(signals.motor.meanJerk / 0.01, 0, 1);
  const jitterNorm = clamp(signals.motor.jitter / 3.0, 0, 1);
  const motorCombined = motorNorm * 0.4 + jerkNorm * 0.3 + jitterNorm * 0.3;
  const motorScore = clamp(Math.round(motorCombined * 55 + rng() * 35 + 5), 3, 97);
  const motorMod = -(motorScore / 100) * 7;

  // 2. Circadian Misalignment
  const hourFrac = signals.circadian.hour + signals.circadian.minute / 60;
  const circDev = Math.abs(hourFrac - 12.5);
  const circNorm = clamp(circDev / 11.5, 0, 1);
  const circScore = clamp(Math.round(circNorm * 50 + rng() * 40 + 5), 3, 97);
  const circMod = -(circScore / 100) * 5;

  // 3. Psychomotor Response Latency — time-to-action + click duration
  const latencyNorm = clamp(signals.interaction.timeOnPageMs / 45000, 0, 1);
  const clickDurNorm = clamp(signals.interaction.meanClickDuration / 300, 0, 1);
  const latencyCombined = latencyNorm * 0.6 + clickDurNorm * 0.4;
  const latencyScore = clamp(Math.round(latencyCombined * 45 + rng() * 45 + 5), 3, 97);
  const latencyMod = -(latencyScore / 100) * 5;

  // 4. Behavioral Entropy — movement + scroll reversals
  const entNorm = clamp(signals.motor.entropy / 3, 0, 1);
  const scrollRevNorm = signals.scroll.totalEvents > 0
    ? clamp(signals.scroll.reversals / signals.scroll.totalEvents, 0, 1)
    : 0;
  const entCombined = entNorm * 0.7 + scrollRevNorm * 0.3;
  const entScore = clamp(Math.round(entCombined * 40 + rng() * 50 + 5), 3, 97);
  const entMod = -(entScore / 100) * 4;

  // 5. Neural Processing Variability — velocity std + keystroke flight std
  const velVarNorm = clamp(signals.motor.velocityStd / 1.2, 0, 1);
  const ksFlightNorm = signals.keystroke.totalKeys > 3
    ? clamp(signals.keystroke.flightStd / 200, 0, 1)
    : 0.5;
  const neuralCombined = velVarNorm * 0.6 + ksFlightNorm * 0.4;
  const neuralScore = clamp(Math.round(neuralCombined * 45 + rng() * 45 + 5), 3, 97);
  const neuralMod = -(neuralScore / 100) * 5;

  // ---- Predicted date -------------------------------------------- //

  const baseExpectancy = 73 + rng() * 18;
  const predictedAge = Math.max(
    bioAge + 2,
    Math.round(baseExpectancy + motorMod + circMod + latencyMod + entMod + neuralMod)
  );

  const currentYear = new Date().getFullYear();
  const yearsRemaining = predictedAge - bioAge;
  const predictedYear = currentYear + yearsRemaining;
  const predictedMonth = Math.floor(rng() * 12);
  const predictedDay = 1 + Math.floor(rng() * 28);
  const predictedDate = new Date(predictedYear, predictedMonth, predictedDay);

  const now = new Date();
  const daysRemaining = Math.max(
    1,
    Math.floor((predictedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // ---- Assemble -------------------------------------------------- //

  const riskFactors: RiskFactor[] = [
    {
      label: "Motor Control Deviation",
      score: motorScore,
      description: "Cursor curvature IQR + jerk + micro-jitter — cognitive-motor integrity",
    },
    {
      label: "Circadian Misalignment",
      score: circScore,
      description: "Deviation from optimal activity window — sleep-wake disruption proxy",
    },
    {
      label: "Psychomotor Response Latency",
      score: latencyScore,
      description: "Time-to-action + click duration — 2nd strongest mortality predictor",
    },
    {
      label: "Behavioral Entropy",
      score: entScore,
      description: "Movement entropy + scroll reversal ratio — motor randomness index",
    },
    {
      label: "Neural Processing Variability",
      score: neuralScore,
      description: "Velocity σ + keystroke flight σ — IIVRT predicts mortality (HR 1.22/SD)",
    },
  ];

  const avg = riskFactors.reduce((s, f) => s + f.score, 0) / riskFactors.length;
  const overallRisk: PredictionResult["overallRisk"] =
    avg < 25 ? "LOW"
      : avg < 40 ? "MODERATE"
        : avg < 55 ? "ELEVATED"
          : avg < 70 ? "HIGH"
            : "CRITICAL";

  // Confidence scales with signal channels (more modalities = more data)
  const baseConf = 0.72 + rng() * 0.08;
  const channelBoost = channels * 0.022;
  const confidence = Math.min(baseConf + channelBoost, 0.96);

  const analysisId = seed.toString(16).toUpperCase().padStart(8, "0");

  return {
    predictedDate: predictedDate.toISOString().split("T")[0],
    confidence,
    daysRemaining,
    estimatedBioAge: bioAge,
    riskFactors,
    overallRisk,
    analysisId,
    signalSummary: {
      dataPoints: signals.motor.dataPoints,
      curvatureIQR: signals.motor.curvatureRatioIQR,
      entropy: signals.motor.entropy,
      circadianDev: circDev,
      latencyMs: signals.interaction.timeOnPageMs,
      velocityStd: signals.motor.velocityStd,
      jitter: signals.motor.jitter,
      keystrokeDwell: signals.keystroke.dwellMean,
      scrollReversals: signals.scroll.reversals,
      jerkMean: signals.motor.meanJerk,
    },
    signalChannels: channels,
  };
}
