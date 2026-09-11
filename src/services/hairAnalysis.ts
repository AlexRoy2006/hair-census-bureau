import {
  MOCK_RESULT,
  type CensusResult,
} from "@/data/census";
import { prepareImage, type PreparedImage } from "./imageProcessor";
import { runHairSegmentation, type HairSegmentationResult } from "./hairSegmentationModel";
import { extractHeadRegion, type HeadRegionOutput } from "@/utils/headRegion";
import { validateImageQuality, type ImageQualityResult } from "@/utils/imageQuality";
import { cleanHairMask, type CleanMaskResult } from "@/utils/maskProcessing";
import {
  calculateHairMetrics,
  estimateHairPopulation,
  classifyHairDensity,
  getClassificationGlyph,
  calculateCensusConfidence,
} from "@/utils/hairMetrics";
import { withTimeout } from "@/utils/withTimeout";

/**
 * EXPLICIT PIPELINE STATE MACHINE STAGES
 * -----------------------------------------------------------------------------
 * Every stage represents a discrete, verifiable step in the computer-vision process.
 */
export type PipelineStage =
  | "IDLE"
  | "PREPARING"
  | "VALIDATING_QUALITY"
  | "LOADING_MODEL"
  | "RUNNING_INFERENCE"
  | "PROCESSING_MASK"
  | "EXTRACTING_HEAD"
  | "CALCULATING_METRICS"
  | "FINALIZING"
  | "COMPLETE"
  | "ERROR";

export interface PipelineProgress {
  stage: PipelineStage;
  stageLabel: string;
  progressPercent: number;
  stepNumber: number; // Single source of truth for step (1, 2, or 3)
  analysisId: string;
  elapsedMs: number;
  error?: string | null;
}

export const STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; percent: number; step: number }
> = {
  IDLE:               { label: "IDLE",                              percent: 0,   step: 1 },
  PREPARING:          { label: "INITIALIZING CENSUS...",            percent: 10,  step: 1 },
  VALIDATING_QUALITY: { label: "VALIDATING IMAGE...",               percent: 20,  step: 1 },
  LOADING_MODEL:      { label: "LOADING SEGMENTATION MODEL...",     percent: 35,  step: 2 },
  RUNNING_INFERENCE:  { label: "IDENTIFYING HAIR...",               percent: 55,  step: 2 },
  PROCESSING_MASK:    { label: "ANALYZING FOLLICULAR DISTRIBUTION...", percent: 70, step: 2 },
  EXTRACTING_HEAD:    { label: "LOCATING HEAD...",                  percent: 80,  step: 3 },
  CALCULATING_METRICS:{ label: "ESTIMATING HAIR POPULATION...",     percent: 90,  step: 3 },
  FINALIZING:         { label: "FINALIZING CENSUS...",              percent: 98,  step: 3 },
  COMPLETE:           { label: "ANALYSIS COMPLETE",                 percent: 100, step: 3 },
  ERROR:              { label: "CENSUS INTERRUPTED",                percent: 0,   step: 3 },
};

// Global Concurrency Lock & Active Request Tracking
let isAnalysisInProgress = false;
let activeAnalysisId: string | null = null;

let activeCapturedImage: PreparedImage | Blob | string | null = null;
let activeAnalysisResult: CensusResult | null = null;
let currentProgressState: PipelineProgress = {
  stage: "IDLE",
  stageLabel: "IDLE",
  progressPercent: 0,
  stepNumber: 1,
  analysisId: "",
  elapsedMs: 0,
};

let progressListeners = new Set<(progress: PipelineProgress) => void>();

export function setCapturedImage(image: PreparedImage | Blob | string | null) {
  activeCapturedImage = image;
}

export function getCapturedImage(): PreparedImage | Blob | string | null {
  return activeCapturedImage;
}

export function clearCapturedImage() {
  activeCapturedImage = null;
}

export function setLatestResult(result: CensusResult) {
  activeAnalysisResult = result;
}

export function getLatestResult(): CensusResult | null {
  return activeAnalysisResult;
}

export function getPipelineProgress(): PipelineProgress {
  return currentProgressState;
}

export function subscribePipelineProgress(listener: (progress: PipelineProgress) => void) {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
}

function updatePipelineStage(
  stage: PipelineStage,
  analysisId: string,
  startTime: number,
  customLabel?: string,
  error: string | null = null,
) {
  const config = STAGE_CONFIG[stage];
  const elapsedMs = Date.now() - startTime;

  currentProgressState = {
    stage,
    stageLabel: customLabel || config.label,
    progressPercent: config.percent,
    stepNumber: config.step,
    analysisId,
    elapsedMs,
    error,
  };

  console.log(
    `[MUDI PIPELINE] Stage: ${stage} (${config.percent}%) | Step 0${config.step} | ID: ${analysisId} | Elapsed: ${elapsedMs}ms${
      customLabel ? ` | Label: ${customLabel}` : ""
    }`,
  );

  progressListeners.forEach((fn) => fn(currentProgressState));
}

/**
 * Generate a 100% deterministic census number from the image data URL hash.
 */
function getDeterministicCensusNumber(dataUrl: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(3000, dataUrl.length); i++) {
    hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
    hash |= 0;
  }
  const numericVal = Math.abs(hash % 90000) + 10000;
  return `MU-2026-${numericVal}`;
}

/**
 * Validate that an analysis result contains non-null, valid numerical metrics.
 */
function validateCensusResult(result: any): boolean {
  if (!result || typeof result !== "object") return false;
  const isNumberValid = (n: any) => typeof n === "number" && !isNaN(n) && isFinite(n);
  return (
    isNumberValid(result.hairCoverage) &&
    isNumberValid(result.scalpExposure) &&
    isNumberValid(result.baldnessIndex) &&
    isNumberValid(result.hairPopulation) &&
    isNumberValid(result.confidence) &&
    typeof result.classification === "string" &&
    result.classification.length > 0
  );
}

/**
 * Wrap a synchronous function in a Promise so it can be used with withTimeout.
 * This prevents a slow synchronous CPU loop from blocking the timeout race.
 */
function runAsync<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    // Use a microtask so any pending state updates flush before execution
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    }, 0);
  });
}

/**
 * MAIN REAL COMPUTER VISION ANALYSIS PIPELINE (Fail-Safe & State-Machine Driven)
 * -----------------------------------------------------------------------------
 * Execution Sequence:
 *   1. Image Preparation            (withTimeout 8s)
 *   2. Quality Validation           (sync, fast)
 *   3. Model Loading + Inference    (withTimeout 15s total — local CV: ~2s)
 *   4. Mask Cleanup                 (sync, fast at 256×256)
 *   5. Head Region Extraction       (withTimeout 5s — sync at 256×256)
 *   6. Metrics & Population Estimate
 *   7. Result Validation & Completion
 */
export async function analyzeHair(
  image?: PreparedImage | Blob | string | null,
  options?: {
    signal?: AbortSignal;
    onProgress?: (progress: PipelineProgress) => void;
  },
): Promise<CensusResult> {
  // Prevent concurrent executions
  if (isAnalysisInProgress) {
    console.warn("[MUDI PIPELINE] Analysis already in progress. Rejecting duplicate call.");
    throw new Error("Analysis is already running.");
  }

  isAnalysisInProgress = true;

  const analysisId = `MU-${Date.now().toString(36).toUpperCase()}`;
  activeAnalysisId = analysisId;
  const startTime = Date.now();

  console.log(`[MUDI PIPELINE] Analysis started (ID: ${analysisId})`);

  const targetImageInput = image ?? activeCapturedImage;

  // Helper: emit progress, checking for abort/stale analysis
  const emit = (stage: PipelineStage, customLabel?: string) => {
    if (options?.signal?.aborted || activeAnalysisId !== analysisId) return;
    updatePipelineStage(stage, analysisId, startTime, customLabel);
    options?.onProgress?.(currentProgressState);
  };

  try {
    // -------------------------------------------------------------------------
    // STAGE 1: PREPARING IMAGE
    // -------------------------------------------------------------------------
    emit("PREPARING");

    console.log("[MUDI PIPELINE] Image preparation started");
    const prepared = await withTimeout(
      prepareImage(targetImageInput),
      8000,
      "Image preparation failed",
    );
    setCapturedImage(prepared);
    console.log(`[MUDI PIPELINE] Image preparation complete (${prepared.width}x${prepared.height})`);

    if (options?.signal?.aborted || activeAnalysisId !== analysisId) {
      throw new DOMException("Census aborted", "AbortError");
    }

    // -------------------------------------------------------------------------
    // STAGE 2: VALIDATING IMAGE QUALITY
    // -------------------------------------------------------------------------
    emit("VALIDATING_QUALITY");

    console.log("[MUDI PIPELINE] Quality validation started");
    const qualityResult: ImageQualityResult = validateImageQuality(prepared.canvas);
    console.log(`[MUDI PIPELINE] Quality validation complete (Score: ${qualityResult.score})`);

    if (!qualityResult.valid) {
      throw new Error("Image quality too low for census analysis. Please capture in brighter lighting.");
    }

    if (options?.signal?.aborted || activeAnalysisId !== analysisId) {
      throw new DOMException("Census aborted", "AbortError");
    }

    // -------------------------------------------------------------------------
    // STAGE 3: LOADING SEGMENTATION MODEL
    // -------------------------------------------------------------------------
    emit("LOADING_MODEL");

    console.log("[MUDI PIPELINE] Model loading started");
    console.log("[MUDI HEAD DEBUG] Starting segmentation model load + inference");

    const segResult: HairSegmentationResult = await withTimeout(
      runHairSegmentation(prepared.canvas, (p: any) => {
        if (options?.signal?.aborted || activeAnalysisId !== analysisId) return;

        // Once model is loaded and inference begins, advance to RUNNING_INFERENCE stage
        if (p.status === "ready" || p.status === "running") {
          emit("RUNNING_INFERENCE");
          return;
        }

        let pct = 0;
        if (typeof p.progress === "number" && !isNaN(p.progress)) {
          pct = p.progress;
        } else if (p.loaded && p.total && p.total > 0) {
          pct = (p.loaded / p.total) * 100;
        }

        let customLabel = "LOADING SEGMENTATION MODEL...";
        if (p.file) {
          const fn = p.file.split("/").pop() || p.file;
          customLabel = `LOADING MODEL (${fn} ${Math.round(pct)}%)`;
        }

        updatePipelineStage("LOADING_MODEL", analysisId, startTime, customLabel);
        options?.onProgress?.(currentProgressState);
      }),
      // Tightened from 25s → 15s. Local CV engine has its own internal 5s timeout.
      15000,
      "Segmentation model timed out. Please try again.",
    );

    console.log(`[MUDI HEAD DEBUG] Segmentation complete — output: ${segResult.width}x${segResult.height}, hair pixels: ${segResult.hairPixelCount}`);
    console.log(`[MUDI HEAD DEBUG] allClassMasks count: ${segResult.allClassMasks.length}`);

    // Advance to RUNNING_INFERENCE if model progress callback never fired "ready"
    emit("RUNNING_INFERENCE");

    if (options?.signal?.aborted || activeAnalysisId !== analysisId) {
      throw new DOMException("Census aborted", "AbortError");
    }

    // -------------------------------------------------------------------------
    // STAGE 4: PROCESSING MASK
    // -------------------------------------------------------------------------
    emit("PROCESSING_MASK");

    console.log("[MUDI PIPELINE] Mask extraction & cleanup started");
    console.log(`[MUDI HEAD DEBUG] Mask dimensions for cleanup: ${segResult.width}x${segResult.height}`);

    const cleanedMaskOutput: CleanMaskResult = cleanHairMask(
      segResult.hairMask,
      segResult.width,
      segResult.height,
    );
    console.log(`[MUDI PIPELINE] Mask cleanup complete — clean: ${cleanedMaskOutput.cleanPixelCount}, noise removed: ${cleanedMaskOutput.noisePixelsRemoved}`);

    // -------------------------------------------------------------------------
    // STAGE 5: EXTRACTING HEAD REGION
    // -------------------------------------------------------------------------
    emit("EXTRACTING_HEAD");

    console.log("[MUDI PIPELINE] Head region calculation started");
    console.log(`[MUDI HEAD DEBUG] Input image: ${prepared.width}x${prepared.height}`);
    console.log(`[MUDI HEAD DEBUG] Segmentation available: ${segResult.allClassMasks.length > 0}`);
    console.log(`[MUDI HEAD DEBUG] Segmentation output type: allClassMasks[${segResult.allClassMasks.length}] at ${segResult.width}x${segResult.height}`);
    console.log(`[MUDI HEAD DEBUG] Class map available: true`);
    console.log(`[MUDI HEAD DEBUG] Starting head-region calculation at dimensions: ${segResult.width}x${segResult.height}`);

    // Wrap in runAsync + withTimeout: extractHeadRegion is synchronous but may be
    // slow on very large dimensions — this ensures the timeout race can fire.
    const headRegion: HeadRegionOutput = await withTimeout(
      runAsync(() => extractHeadRegion(
        segResult.allClassMasks,
        segResult.width,
        segResult.height,
      )),
      5000,
      "Head region calculation timed out. Please center your head and try again.",
    );

    console.log(`[MUDI HEAD DEBUG] Head-region calculation complete`);
    console.log(`[MUDI HEAD DEBUG] Head pixels: ${headRegion.totalHeadPixels}`);
    console.log(`[MUDI HEAD DEBUG] Head pixel ratio: ${(headRegion.headPixelRatio * 100).toFixed(2)}%`);
    console.log(`[MUDI HEAD DEBUG] hasUsableHead: ${headRegion.hasUsableHead}`);
    console.log("[MUDI HEAD DEBUG] Head detection complete");

    if (!headRegion.hasUsableHead) {
      throw new Error(
        "Unable to locate a usable head region. Please center your head clearly inside the frame and try again.",
      );
    }

    if (options?.signal?.aborted || activeAnalysisId !== analysisId) {
      throw new DOMException("Census aborted", "AbortError");
    }

    // -------------------------------------------------------------------------
    // STAGE 6: CALCULATING METRICS
    // -------------------------------------------------------------------------
    emit("CALCULATING_METRICS");

    console.log("[MUDI PIPELINE] Metrics calculation started");
    const metrics = calculateHairMetrics(cleanedMaskOutput.cleanedMask, headRegion);
    const populationEstimate = estimateHairPopulation(metrics.hairCoverage, qualityResult.score);
    const classification = classifyHairDensity(metrics.hairCoverage);
    const glyph = getClassificationGlyph(classification);
    const confidence = calculateCensusConfidence(
      segResult.hairConfidence,
      qualityResult.score,
      headRegion.headPixelRatio,
      cleanedMaskOutput.maskQualityScore,
    );
    console.log(`[MUDI PIPELINE] Metrics complete — Coverage: ${metrics.hairCoverage}%, Classification: ${classification}`);

    // -------------------------------------------------------------------------
    // STAGE 7: FINALIZING CENSUS RESULT
    // -------------------------------------------------------------------------
    emit("FINALIZING");

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const censusNumber = getDeterministicCensusNumber(prepared.dataUrl);

    const result: CensusResult = {
      censusNumber,
      issuedAt: dateStr,
      hairPopulation: populationEstimate.population,
      populationMargin: populationEstimate.uncertainty,
      hairCoverage: metrics.hairCoverage,
      scalpExposure: metrics.scalpExposure,
      baldnessIndex: metrics.baldnessIndex,
      confidence,
      classification,
      classificationGlyph: glyph,
      populationStatus:
        metrics.hairCoverage >= 70
          ? "HAIR POPULATION: THRIVING"
          : metrics.hairCoverage >= 45
            ? "HAIR POPULATION: STABLE"
            : metrics.hairCoverage >= 20
              ? "HAIR POPULATION: MODERATE"
              : "HAIR POPULATION: DEFICIT",
      classificationNote: `Measured hair coverage (${metrics.hairCoverage}%) maps to ${classification} classification under protocol MU-01.`,
      verdict:
        metrics.hairCoverage >= 20
          ? "HAIR DETECTED. The vision model confirms that the subject currently possesses a statistically significant hair population."
          : "LOW DENSITY DETECTED. Measured follicle distribution falls within sparse census thresholds.",
      twin: MOCK_RESULT.twin,
      telemetry: {
        pixelsAnalysed: prepared.width * prepared.height,
        regionDetected: "HEAD / SCALP",
        analysisRegion: "01",
      },
    };

    // Validate result before completion
    if (!validateCensusResult(result)) {
      throw new Error("Generated census result contains invalid data");
    }

    if (options?.signal?.aborted || activeAnalysisId !== analysisId) {
      throw new DOMException("Census aborted", "AbortError");
    }

    emit("COMPLETE");

    console.log(`[MUDI PIPELINE] Analysis complete in ${Date.now() - startTime}ms`);
    setLatestResult(result);
    return result;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.log(`[MUDI PIPELINE] Analysis ${analysisId} aborted cleanly`);
      updatePipelineStage("IDLE", analysisId, startTime, "IDLE");
      throw err;
    }

    const errMessage =
      err?.message || "Unable to analyze this image. Please try another image with better lighting.";
    console.error(`[MUDI PIPELINE] Analysis ${analysisId} FAILED:`, errMessage);

    updatePipelineStage("ERROR", analysisId, startTime, "CENSUS INTERRUPTED", errMessage);
    options?.onProgress?.(currentProgressState);
    throw new Error(errMessage);
  } finally {
    // Release Concurrency Lock — ALWAYS runs even on abort/error
    isAnalysisInProgress = false;
  }
}
