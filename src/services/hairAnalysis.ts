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
  stepNumber: number;
  analysisId: string;
  elapsedMs: number;
  error?: string | null;
}

/**
 * STAGE_CONFIG is the single source of truth for progress percentages and labels.
 * The UI derives its display directly from this — no disconnected decorative list.
 */
export const STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; percent: number; step: number }
> = {
  IDLE:                { label: "IDLE",                               percent: 0,   step: 1 },
  PREPARING:           { label: "INITIALIZING CENSUS...",             percent: 10,  step: 1 },
  VALIDATING_QUALITY:  { label: "VALIDATING IMAGE QUALITY...",        percent: 20,  step: 1 },
  LOADING_MODEL:       { label: "LOADING SEGMENTATION MODEL...",      percent: 35,  step: 2 },
  RUNNING_INFERENCE:   { label: "IDENTIFYING HAIR...",                percent: 55,  step: 2 },
  PROCESSING_MASK:     { label: "ANALYZING FOLLICULAR DISTRIBUTION...", percent: 70, step: 2 },
  EXTRACTING_HEAD:     { label: "LOCATING HEAD...",                   percent: 80,  step: 3 },
  CALCULATING_METRICS: { label: "ESTIMATING HAIR POPULATION...",      percent: 90,  step: 3 },
  FINALIZING:          { label: "FINALIZING CENSUS...",               percent: 98,  step: 3 },
  COMPLETE:            { label: "ANALYSIS COMPLETE",                  percent: 100, step: 3 },
  ERROR:               { label: "CENSUS INTERRUPTED",                 percent: 0,   step: 3 },
};

/**
 * Ordered list of real pipeline stages in execution order (excludes IDLE/COMPLETE/ERROR).
 * Used by the UI to render a live checklist that maps 1:1 with actual pipeline stages.
 */
export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  "PREPARING",
  "VALIDATING_QUALITY",
  "LOADING_MODEL",
  "RUNNING_INFERENCE",
  "PROCESSING_MASK",
  "EXTRACTING_HEAD",
  "CALCULATING_METRICS",
  "FINALIZING",
];

// ─── Module-level state ───────────────────────────────────────────────────────
// IMPORTANT: We do NOT use a boolean isAnalysisInProgress lock here.
// A boolean lock persists across component unmount/remount and can cause
// a freshly mounted component's analyzeHair() call to be rejected as a
// "duplicate" even though the previous run was already aborted and the
// component has been fully unmounted and remounted.
//
// Instead, we use activeAnalysisId: each run gets a unique ID. Any
// in-flight async callbacks from a stale run detect the mismatch and
// bail out WITHOUT touching React state owned by the new run.
// ─────────────────────────────────────────────────────────────────────────────
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
    `[MUDI PIPELINE] ${analysisId} | Stage: ${stage} (${config.percent}%) | ` +
    `Elapsed: ${elapsedMs}ms${customLabel ? ` | "${customLabel}"` : ""}`,
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
 * The setTimeout(0) allows the JS event loop to process any pending microtasks
 * (including abort signal checks) before the synchronous work begins.
 */
function runAsync<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
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
 *   1. Image Preparation            (withTimeout 8s + internal decode timeout 6s)
 *   2. Quality Validation           (sync, fast)
 *   3. Model Loading + Inference    (withTimeout 15s — local CV engine: ~1-3s)
 *   4. Mask Cleanup                 (sync, fast at 256×256)
 *   5. Head Region Extraction       (withTimeout 5s)
 *   6. Metrics & Population Estimate (sync, fast)
 *   7. Result Validation & Completion
 *
 * CONCURRENCY MODEL:
 * We cancel any in-flight run by generating a new analysisId. Old async callbacks
 * compare their captured analysisId against the module-level activeAnalysisId and
 * bail out without touching state if they don't match. This is safe across
 * component remounts, React StrictMode double-invocation, and TanStack preloading.
 */
export async function analyzeHair(
  image?: PreparedImage | Blob | string | null,
  options?: {
    signal?: AbortSignal;
    onProgress?: (progress: PipelineProgress) => void;
  },
): Promise<CensusResult> {
  // Generate a unique ID for this run. Setting activeAnalysisId to this value
  // atomically cancels any still-running callbacks from a previous run — they
  // will detect the mismatch and stop without touching UI state.
  const analysisId = `MU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  activeAnalysisId = analysisId;
  const startTime = Date.now();

  console.log(`[MUDI PIPELINE] ▶ Analysis started (ID: ${analysisId})`);

  const targetImageInput = image ?? activeCapturedImage;

  /**
   * emit() — update pipeline stage and notify the UI.
   * Returns false (and skips update) if this run has been superseded by a
   * newer run or if the AbortSignal has fired.
   */
  const emit = (stage: PipelineStage, customLabel?: string): boolean => {
    if (options?.signal?.aborted) {
      console.log(`[MUDI PIPELINE] ${analysisId} | emit(${stage}) skipped — signal aborted`);
      return false;
    }
    if (activeAnalysisId !== analysisId) {
      console.log(`[MUDI PIPELINE] ${analysisId} | emit(${stage}) skipped — superseded by ${activeAnalysisId}`);
      return false;
    }
    updatePipelineStage(stage, analysisId, startTime, customLabel);
    options?.onProgress?.(currentProgressState);
    return true;
  };

  try {
    // -------------------------------------------------------------------------
    // STAGE 1: PREPARING IMAGE
    // -------------------------------------------------------------------------
    emit("PREPARING");

    console.log(`[MUDI PIPELINE] ${analysisId} | Image preparation started`);
    const prepared = await withTimeout(
      prepareImage(targetImageInput),
      8000,
      "Image preparation failed — the captured image could not be loaded",
    );
    // Update the stored image to the normalised PreparedImage for downstream use
    setCapturedImage(prepared);
    console.log(`[MUDI PIPELINE] ${analysisId} | Image preparation complete (${prepared.width}x${prepared.height})`);

    if (options?.signal?.aborted || activeAnalysisId !== analysisId) {
      throw new DOMException("Census aborted", "AbortError");
    }

    // -------------------------------------------------------------------------
    // STAGE 2: VALIDATING IMAGE QUALITY
    // -------------------------------------------------------------------------
    emit("VALIDATING_QUALITY");

    console.log(`[MUDI PIPELINE] ${analysisId} | Quality validation started`);
    const qualityResult: ImageQualityResult = validateImageQuality(prepared.canvas);
    console.log(`[MUDI PIPELINE] ${analysisId} | Quality validation complete (Score: ${qualityResult.score})`);

    if (!qualityResult.valid) {
      throw new Error("Image quality too low for census analysis. Please capture in brighter lighting.");
    }

    if (options?.signal?.aborted || activeAnalysisId !== analysisId) {
      throw new DOMException("Census aborted", "AbortError");
    }

    // -------------------------------------------------------------------------
    // STAGE 3: LOADING SEGMENTATION MODEL + RUNNING INFERENCE
    // -------------------------------------------------------------------------
    emit("LOADING_MODEL");
    console.log(`[MUDI PIPELINE] ${analysisId} | Model load + inference started`);

    const segResult: HairSegmentationResult = await withTimeout(
      runHairSegmentation(prepared.canvas, (p: any) => {
        // Bail out immediately if this run has been superseded or aborted
        if (options?.signal?.aborted || activeAnalysisId !== analysisId) return;

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

        // Only update if still the active run
        if (activeAnalysisId === analysisId && !options?.signal?.aborted) {
          updatePipelineStage("LOADING_MODEL", analysisId, startTime, customLabel);
          options?.onProgress?.(currentProgressState);
        }
      }),
      15000,
      "Segmentation model timed out. Please try again.",
    );

    console.log(
      `[MUDI PIPELINE] ${analysisId} | Segmentation complete — ` +
      `${segResult.width}x${segResult.height}, hair pixels: ${segResult.hairPixelCount}, ` +
      `classes: ${segResult.allClassMasks.length}`,
    );

    // Ensure we are at RUNNING_INFERENCE before moving on (in case the progress
    // callback never fired a "ready" event for the local CV engine)
    emit("RUNNING_INFERENCE");

    if (options?.signal?.aborted || activeAnalysisId !== analysisId) {
      throw new DOMException("Census aborted", "AbortError");
    }

    // -------------------------------------------------------------------------
    // STAGE 4: PROCESSING MASK
    // -------------------------------------------------------------------------
    emit("PROCESSING_MASK");

    const cleanedMaskOutput: CleanMaskResult = cleanHairMask(
      segResult.hairMask,
      segResult.width,
      segResult.height,
    );
    console.log(
      `[MUDI PIPELINE] ${analysisId} | Mask cleanup — ` +
      `clean px: ${cleanedMaskOutput.cleanPixelCount}, noise removed: ${cleanedMaskOutput.noisePixelsRemoved}`,
    );

    // -------------------------------------------------------------------------
    // STAGE 5: EXTRACTING HEAD REGION
    // -------------------------------------------------------------------------
    emit("EXTRACTING_HEAD");
    console.log(`[MUDI PIPELINE] ${analysisId} | Head region extraction started`);

    const headRegion: HeadRegionOutput = await withTimeout(
      runAsync(() => extractHeadRegion(
        segResult.allClassMasks,
        segResult.width,
        segResult.height,
      )),
      5000,
      "Head region calculation timed out. Please center your head and try again.",
    );

    console.log(
      `[MUDI PIPELINE] ${analysisId} | Head region — ` +
      `pixels: ${headRegion.totalHeadPixels}, ratio: ${(headRegion.headPixelRatio * 100).toFixed(1)}%, ` +
      `usable: ${headRegion.hasUsableHead}`,
    );

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
    console.log(`[MUDI PIPELINE] ${analysisId} | Metrics — coverage: ${metrics.hairCoverage}%, class: ${classification}`);

    // -------------------------------------------------------------------------
    // STAGE 7: FINALIZING CENSUS RESULT
    // -------------------------------------------------------------------------
    emit("FINALIZING");

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0] ?? "";
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

    if (!validateCensusResult(result)) {
      throw new Error("Generated census result contains invalid data — please retake the photo");
    }

    if (options?.signal?.aborted || activeAnalysisId !== analysisId) {
      throw new DOMException("Census aborted", "AbortError");
    }

    emit("COMPLETE");

    const totalMs = Date.now() - startTime;
    console.log(`[MUDI PIPELINE] ✓ Analysis ${analysisId} complete in ${totalMs}ms`);
    setLatestResult(result);
    return result;

  } catch (err: any) {
    if (err?.name === "AbortError") {
      // The run was deliberately cancelled (component unmount, navigation away,
      // or a newer run superseded this one). Do NOT update any UI state here —
      // the component that owns this signal is either gone or has already started
      // a fresh run with a clean state. Logging only.
      console.log(`[MUDI PIPELINE] ✕ Analysis ${analysisId} aborted after ${Date.now() - startTime}ms`);
      throw err; // Re-throw so the caller's catch block can detect AbortError
    }

    const errMessage =
      err?.message || "Unable to analyze this image. Please try another image with better lighting.";
    console.error(`[MUDI PIPELINE] ✕ Analysis ${analysisId} FAILED (${Date.now() - startTime}ms):`, errMessage);

    // Only update UI state if this run is still the active one.
    // If it has been superseded, the new run is already running and we must not
    // overwrite its state with an error from a stale operation.
    if (activeAnalysisId === analysisId && !options?.signal?.aborted) {
      updatePipelineStage("ERROR", analysisId, startTime, "CENSUS INTERRUPTED", errMessage);
      options?.onProgress?.(currentProgressState);
    }

    throw new Error(errMessage);
  }
}
