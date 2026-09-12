/**
 * MUDI UNDO?™ — CENSUS TWIN MATCHER SERVICE
 * -----------------------------------------------------------------------------
 * Deterministic character matching service based strictly on hair census metrics.
 * Uses coverage distance as primary criteria with census telemetry as tie-breakers.
 */

import { CENSUS_TWINS, FALLBACK_TWIN, type CensusTwinProfile } from "@/data/censusTwins";
import type { CensusResult } from "@/data/census";

export interface CensusTwinMatchResult {
  id: string;
  name: string;
  franchise: string;
  image: string;
  association: string;
  note: string;
  matchScore: number;
  targetHairCoverage: number;
}

export interface MatchInputOptions {
  hairCoverage: number;
  confidence?: number;
  scalpExposure?: number;
  hairPopulation?: number;
  classification?: string;
  censusNumber?: string;
}

/**
 * Deterministically match a subject to a Census Twin using only hair metrics.
 */
export function matchCensusTwin(input: MatchInputOptions): CensusTwinMatchResult {
  const normCoverage = Math.min(Math.max(Number(input.hairCoverage) || 0, 0), 100);
  const normConfidence = Math.min(Math.max(Number(input.confidence) || 85, 0), 100);
  const censusNumber = input.censusNumber || "MU-2026-00000";

  // 1. Calculate distance for each character from target hair coverage
  // Calculate deterministic tie-breaker hash from censusNumber
  let hash = 0;
  for (let i = 0; i < censusNumber.length; i++) {
    hash = ((hash << 5) - hash + censusNumber.charCodeAt(i)) | 0;
  }
  const hashMod = Math.abs(hash) % 100;

  // Additional secondary metric weighting (scalpExposure, population factor)
  const scalpFactor = (input.scalpExposure ?? (100 - normCoverage)) / 100;
  const popFactor = Math.min((input.hairPopulation ?? 50000) / 120000, 1.0);

  const scored = CENSUS_TWINS.map((character, idx) => {
    // Primary distance
    const coverageDistance = Math.abs(character.targetHairCoverage - normCoverage);

    // Secondary micro-adjustment using scalp Exposure and deterministic hash (no randomness)
    const secondaryWeight = Math.abs((100 - character.targetHairCoverage) / 100 - scalpFactor) * 0.05;
    const tieBreaker = ((hashMod + idx * 17) % 20) * 0.005;

    const totalDistance = coverageDistance + secondaryWeight + tieBreaker;

    return { character, coverageDistance, totalDistance };
  });

  // Sort by total distance ascending (closest target match wins)
  scored.sort((a, b) => a.totalDistance - b.totalDistance);

  const bestMatch = scored[0]?.character ?? FALLBACK_TWIN;
  const dist = scored[0]?.coverageDistance ?? 0;

  // 2. Compute match percentage score formatted to 1 decimal place (e.g. 94.7%)
  const rawScore = 100 - dist * 1.35;
  // Apply minor confidence scaling (85% confidence = default baseline)
  const confidenceAdjustment = (normConfidence - 85) * 0.05;
  const matchScore = Number(
    Math.min(98.9, Math.max(68.5, rawScore + confidenceAdjustment)).toFixed(1)
  );

  return {
    id: bestMatch.id,
    name: bestMatch.name,
    franchise: bestMatch.franchise,
    image: bestMatch.image,
    association: bestMatch.association,
    note: bestMatch.description,
    matchScore,
    targetHairCoverage: bestMatch.targetHairCoverage,
  };
}

/**
 * Backward compatibility wrapper function for existing callers
 */
export function findCensusTwin(
  hairCoverage: number,
  confidence: number = 85,
  censusNumber: string = ""
): CensusResult["twin"] {
  const matched = matchCensusTwin({
    hairCoverage,
    confidence,
    censusNumber,
  });

  return {
    id: matched.id,
    name: matched.name.toUpperCase(),
    franchise: matched.franchise,
    image: matched.image,
    association: matched.association.toUpperCase(),
    note: matched.note,
    matchScore: matched.matchScore,
    targetHairCoverage: matched.targetHairCoverage,
  };
}
