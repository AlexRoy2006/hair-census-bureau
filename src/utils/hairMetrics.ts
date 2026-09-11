import type { Classification } from "@/data/census";
import type { HeadRegionOutput } from "./headRegion";

/**
 * HAIR METRICS COMPUTATION SERVICE
 * -----------------------------------------------------------------------------
 * Pure deterministic formulas for hair coverage, scalp exposure, baldness index,
 * density classification, and follicle population estimates.
 *
 * NOTE: All output values are experimental computer-vision estimates and are
 * NOT medically validated measurements.
 */

export interface HairMetricsResult {
  hairCoverage: number; // 0.0 - 100.0%
  scalpExposure: number; // 0.0 - 100.0%
  baldnessIndex: number; // 0.0 - 100.0%
  hairPixelsInsideHead: number;
  totalHeadPixels: number;
}

export interface PopulationEstimate {
  population: number; // estimated strand count integer
  uncertainty: number; // margin of error (+/- strand count)
}

/**
 * Calculate actual hair coverage over the extracted head/scalp analysis region.
 *
 * hairCoverage = (hair pixels inside head region / total pixels inside head region) * 100
 * scalpExposure = clamp(100 - hairCoverage, 0, 100)
 * baldnessIndex = scalpExposure
 */
export function calculateHairMetrics(
  hairMask: Uint8Array | null,
  headRegion: HeadRegionOutput | null,
): HairMetricsResult {
  if (!hairMask || !headRegion || !headRegion.headMask || headRegion.totalHeadPixels <= 0) {
    return {
      hairCoverage: 0,
      scalpExposure: 100,
      baldnessIndex: 100,
      hairPixelsInsideHead: 0,
      totalHeadPixels: 0,
    };
  }

  const { headMask, totalHeadPixels } = headRegion;
  let hairPixelsInsideHead = 0;

  for (let i = 0; i < headMask.length; i++) {
    if (headMask[i] === 1 && hairMask[i] === 1) {
      hairPixelsInsideHead++;
    }
  }

  const rawCoverage = (hairPixelsInsideHead / totalHeadPixels) * 100;
  const hairCoverage = Math.round(Math.min(100, Math.max(0, rawCoverage)) * 10) / 10;
  const scalpExposure = Math.round(Math.min(100, Math.max(0, 100 - hairCoverage)) * 10) / 10;
  const baldnessIndex = scalpExposure;

  return {
    hairCoverage,
    scalpExposure,
    baldnessIndex,
    hairPixelsInsideHead,
    totalHeadPixels,
  };
}

/**
 * Explicitly ESTIMATES total hair follicle population derived deterministically
 * from the measured hair coverage and image quality score.
 *
 * Formula:
 * estimatedPopulation = round(100,000 * (hairCoverage / 100) ^ 1.15)
 * uncertainty = round((8,000 + (1 - hairCoverage/100) * 6,000) / qualityFactor)
 */
export function estimateHairPopulation(
  hairCoverage: number,
  imageQualityScore: number = 85,
): PopulationEstimate {
  const BASE_MAX_POPULATION = 100_000;
  const normalizedCoverage = Math.max(0, Math.min(100, hairCoverage)) / 100;

  // Exponential density curve
  const estimatedStrands = Math.round(BASE_MAX_POPULATION * Math.pow(normalizedCoverage, 1.15));

  // Margin of uncertainty based on image quality factor
  const qualityFactor = Math.max(0.4, Math.min(1.0, imageQualityScore / 100));
  const baseMargin = 8_000 + Math.round((1 - normalizedCoverage) * 6_000);
  const uncertainty = Math.round(baseMargin / qualityFactor);

  return {
    population: Math.max(0, estimatedStrands),
    uncertainty: Math.max(1_000, uncertainty),
  };
}

/**
 * Classifies hair density according to the official census scale.
 *
 * 90–100% → DENSE FOREST
 * 70–89%  → WOODLAND
 * 45–69%  → GRASSLAND
 * 20–44%  → DRY LAND
 * 1–19%   → DESERT
 * ~0%     → MOON SURFACE
 */
export function classifyHairDensity(hairCoverage: number): Classification {
  const c = Math.max(0, Math.min(100, hairCoverage));

  if (c >= 90) return "DENSE FOREST";
  if (c >= 70) return "WOODLAND";
  if (c >= 45) return "GRASSLAND";
  if (c >= 20) return "DRY LAND";
  if (c >= 1) return "DESERT";
  return "MOON SURFACE";
}

export function getClassificationGlyph(classification: Classification): string {
  switch (classification) {
    case "DENSE FOREST":
      return "🌳";
    case "WOODLAND":
      return "🌲";
    case "GRASSLAND":
      return "🌾";
    case "DRY LAND":
      return "🪨";
    case "DESERT":
      return "🌵";
    case "MOON SURFACE":
      return "🌕";
    default:
      return "🌳";
  }
}

/**
 * Computes a deterministic confidence score (0.0 to 100.0%) derived from:
 *   - Model segmentation confidence (35%)
 *   - Image quality score (35%)
 *   - Head framing ratio (20%)
 *   - Mask quality score (10%)
 */
export function calculateCensusConfidence(
  modelConfidence: number,
  imageQualityScore: number,
  headPixelRatio: number,
  maskQualityScore: number = 90,
): number {
  const modelFactor = Math.min(100, Math.max(40, modelConfidence));
  const qualityFactor = Math.min(100, Math.max(20, imageQualityScore));
  const maskFactor = Math.min(100, Math.max(30, maskQualityScore));

  // Ideal head framing ratio is between 15% and 65% of the total frame
  let framingFactor = 85;
  if (headPixelRatio >= 0.15 && headPixelRatio <= 0.65) {
    framingFactor = 98;
  } else if (headPixelRatio < 0.08 || headPixelRatio > 0.8) {
    framingFactor = 65;
  }

  const rawConfidence =
    modelFactor * 0.35 + qualityFactor * 0.35 + framingFactor * 0.2 + maskFactor * 0.1;

  return Math.round(Math.min(99.4, Math.max(30.0, rawConfidence)) * 10) / 10;
}
