# WHEN

Behavioral mortality prediction engine. Multi-modal digital phenotyping with 3D visualization.

**For entertainment purposes only.** No real health data is used, stored, or transmitted.

## What It Does

WHEN passively analyzes your behavioral patterns through 6 independent signal channels, then generates a simulated mortality prediction based on published digital phenotyping research.

You don't fill out forms or answer questions. You just interact with the page.

## Signal Channels

| Channel | What's Measured | Research Basis |
|---------|----------------|----------------|
| Motor Control | Velocity, acceleration, jerk (3rd derivative), curvature ratio IQR, action segmentation | Seelye et al. (PMC4748737), ACM Computing Surveys 2024 |
| Keystroke Dynamics | Dwell time, flight time, error rate | CMU Keystroke Benchmark (EER 0.45%) |
| Scroll Behavior | Velocity, variance, direction reversals | Antal & Bokor, 2015 |
| Click Patterns | Click duration, precision timing | BehavioSec methodology |
| Micro-Tremor | Sub-pixel displacement during stillness | Nature Digital Medicine, 2019 |
| Attention State | Tab visibility changes, idle periods | BiAffect, Page Visibility API |

40+ computed features including skewness, kurtosis, entropy, and statistical moments feed into the prediction algorithm.

## Stack

- **Framework**: Next.js 15 + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **3D Visualization**: Three.js via @react-three/fiber + @react-three/drei
- **Security**: CSP headers, HSTS, rate limiting, input validation

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
app/
  page.tsx              — Main UI: collection, analysis, result phases
  api/predict/route.ts  — Prediction endpoint with rate limiting
  api/contribute/route.ts — Anonymous community contribution endpoint
  globals.css           — Animations, grain overlay, vignette
  layout.tsx            — Fonts, metadata
components/
  RiskVisualization3D.tsx — Three.js behavioral signature visualization
lib/
  predictor.ts          — Prediction algorithm, bio age estimation, risk factors
middleware.ts           — Security headers (CSP, HSTS, X-Frame-Options)
```

## Privacy

- **No data persistence.** Nothing is stored on disk or in a database.
- **No external transmission.** All behavioral analysis happens client-side. Only computed signal summaries are sent to the local API.
- **No PII collected.** No names, emails, or identifiers.
- **Community contributions are anonymized.** Only aggregate scores (risk level, entropy, curvature IQR) are submitted. No mouse data or device fingerprints.
- **Rate limited.** 20 predictions/min, 2 contributions/5min per IP.

## Research References

- Seelye et al. — Mouse curvature variability as MCI marker (PMC4748737)
- NHANES-III — Reaction time as mortality predictor (PMC3906008)
- Sydney Memory & Ageing Study — IIVRT > mean RT (HR 1.22/SD)
- Nature Digital Medicine 2019 — Population-scale tremor via mouse cursor
- CMU Keystroke Benchmark — Keystroke dynamics authentication
- ACM Computing Surveys 2024 — Mouse dynamics taxonomy, action segmentation
- BiAffect / Harvard Onnela Lab — Digital phenotyping
- AHA — Circadian disruption and cardiovascular health

## License

MIT
