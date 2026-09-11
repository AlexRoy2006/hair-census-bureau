/**
 * MOCK CENSUS DATA
 * -----------------------------------------------------------------------------
 * Every value below is fabricated. When the real browser-based computer-vision
 * pipeline lands, `analyzeHair()` in src/lib/analyzeHair.ts should produce an
 * object with this exact `CensusResult` shape and nothing else in the UI needs
 * to change.
 */

export const SYSTEM_META = {
  protocol: "MU-01",
  status: "OPERATIONAL",
  dataClass: "HUMAN HAIR",
  version: "1.0",
  department: "NATIONAL DEPARTMENT OF HAIR STATISTICS",
  division: "CENSUS DIVISION",
} as const;

export const CLASSIFICATION_SCALE = [
  "MOON SURFACE",
  "DESERT",
  "DRY LAND",
  "GRASSLAND",
  "WOODLAND",
  "DENSE FOREST",
] as const;

export type Classification = (typeof CLASSIFICATION_SCALE)[number];

export type AnalysisStage = {
  id: string;
  label: string;
  /** ms after analysis start when this stage completes */
  at: number;
};

export const ANALYSIS_STAGES: AnalysisStage[] = [
  { id: "locate", label: "LOCATING HEAD", at: 900 },
  { id: "scalp", label: "MAPPING SCALP", at: 1800 },
  { id: "hair", label: "DETECTING HAIR", at: 2800 },
  { id: "population", label: "ESTIMATING POPULATION", at: 3700 },
  { id: "density", label: "CALCULATING DENSITY", at: 4500 },
  { id: "finalize", label: "FINALIZING CENSUS", at: 5300 },
];

export const ANALYSIS_DURATION_MS = 5800;

export const ANALYSIS_TELEMETRY = {
  pixelsAnalysed: 1_482_912,
  regionDetected: "HEAD / SCALP",
  segmentation: "IN PROGRESS",
  model: "MU-VISION / FOLLICLE-NET",
  frameRate: "30 FPS",
} as const;

export type CensusResult = {
  censusNumber: string;
  issuedAt: string;
  hairPopulation: number;
  populationMargin: number;
  hairCoverage: number;
  scalpExposure: number;
  baldnessIndex: number;
  confidence: number;
  classification: Classification;
  classificationGlyph: string;
  populationStatus: string;
  classificationNote: string;
  verdict: string;
  twin: {
    name: string;
    association: string;
    note: string;
  };
  telemetry: {
    pixelsAnalysed: number;
    regionDetected: string;
    analysisRegion: string;
  };
};

export const MOCK_RESULT: CensusResult = {
  censusNumber: "MU-2026-48291",
  issuedAt: "2026-09-11",
  hairPopulation: 47_382,
  populationMargin: 11_420,
  hairCoverage: 78.4,
  scalpExposure: 21.6,
  baldnessIndex: 21.6,
  confidence: 84.7,
  classification: "DENSE FOREST",
  classificationGlyph: "🌳",
  populationStatus: "HAIR POPULATION: THRIVING",
  classificationNote:
    "Hair coverage exceeds the national threshold for healthy woodland classification.",
  verdict:
    "Hair detected. The census department confirms that the subject currently possesses a statistically significant quantity of hair.",
  twin: {
    name: "SAITAMA",
    association: "LOW-FOLLICLE ASSOCIATION",
    note: "Matched using hair-density classification only. This is not facial recognition.",
  },
  telemetry: {
    pixelsAnalysed: 1_482_912,
    regionDetected: "HEAD / SCALP",
    analysisRegion: "01",
  },
};

export const DISPUTE_REASONS = [
  "I have more hair than reported",
  "I have less hair than reported",
  "The machine is lying",
  "I refuse to accept reality",
  "Other",
] as const;

export const DISPUTE_RESPONSE = [
  "Your complaint has been registered.",
  "Forwarded to the Department of Hair Affairs.",
  "Expected response time: 7–14 business follicles.",
] as const;

export const DISCLAIMER = [
  "FOR ENTERTAINMENT AND EXPERIMENTAL COMPUTER-VISION PURPOSES ONLY.",
  "RESULTS ARE ESTIMATES AND ARE NOT MEDICAL MEASUREMENTS.",
] as const;
