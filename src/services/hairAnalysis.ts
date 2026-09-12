import {
  ANALYSIS_DURATION_MS,
  MOCK_RESULT,
  type CensusResult,
  type Classification,
} from "@/data/census";
import { type ProcessedImage, getImageFingerprint } from "./imageProcessor";
import { analyzeHairWithGemini, type GeminiAnalysisResponse } from "./geminiServerFn";

let activeCapturedImage: ProcessedImage | Blob | string | null = null;
let activeAnalysisResult: CensusResult | null = null;
let latestGeminiDebugResponse: {
  received: boolean;
  analysisId?: string;
  fingerprint?: string;
  data?: GeminiAnalysisResponse;
  error?: string;
} = { received: false };

let analysisInvocationCount = 0;

export function setCapturedImage(image: ProcessedImage | Blob | string | null) {
  activeCapturedImage = image;
}

export function getCapturedImage(): ProcessedImage | Blob | string | null {
  return activeCapturedImage;
}

export function clearCapturedImage() {
  activeCapturedImage = null;
}

export function setLatestResult(result: CensusResult) {
  activeAnalysisResult = result;
}

export function getLatestResult(): CensusResult {
  return activeAnalysisResult || MOCK_RESULT;
}

export function getGeminiDebugInfo() {
  return latestGeminiDebugResponse;
}

/**
 * Transparent, deterministic heuristic for estimating hair population.
 *
 * Base full-scalp density: ~120,000 hair follicles (100% coverage benchmark).
 *
 * Formula:
 * rawPopulation = baseDensity (120,000) * (hairCoverage / 100) * (0.90 + confidence / 500)
 *
 * Rounded to nearest 500 to avoid false precision (e.g. 96,500 instead of 96,482).
 */
export function estimateHairPopulation(
  hairCoverage: number,
  confidence: number = 85,
  analysisId: string = "MUDI-000",
): { hairPopulation: number; populationMargin: number } {
  const normCoverage = Number(hairCoverage) || 0;
  const normConfidence = Number(confidence) || 85;

  const coverageRatio = Math.min(Math.max(normCoverage, 0), 100) / 100;
  const confidenceRatio = Math.min(Math.max(normConfidence, 0), 100) / 100;

  // Baseline hair count for a healthy adult scalp at 100% coverage
  const baseFullScalpDensity = 120_000;

  // Confidence scaling factor: 0.90 to 1.10
  const confidenceAdjustment = 0.9 + confidenceRatio * 0.2;

  const rawPopulation = baseFullScalpDensity * coverageRatio * confidenceAdjustment;

  // Sensible rounding to nearest 500 to prevent false precision
  const hairPopulation = Math.max(0, Math.round(rawPopulation / 500) * 500);

  // Margin calculation based on inverse confidence (lower confidence = higher margin)
  const marginPercentage = 0.10 + (1 - confidenceRatio) * 0.15;
  const populationMargin = Math.round((hairPopulation * marginPercentage) / 100) * 100;

  console.log(`[MUDI POPULATION] Analysis ID: ${analysisId}`);
  console.log(`[MUDI POPULATION] hairCoverage: ${normCoverage.toFixed(1)}`);
  console.log(`[MUDI POPULATION] confidence: ${normConfidence.toFixed(1)}`);
  console.log(`[MUDI POPULATION] estimatedPopulation: ${hairPopulation}`);

  return { hairPopulation, populationMargin };
}

/**
 * Converts Blob or ProcessedImage into a base64 DataURL string.
 */
async function toBase64(input: ProcessedImage | Blob | string): Promise<string> {
  if (typeof input === "string") return input;
  if ("dataUrl" in input && typeof input.dataUrl === "string") return input.dataUrl;

  const blob = "blob" in input ? input.blob : input;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Main Hair Analysis function called during census.
 */
export async function analyzeHair(
  image?: ProcessedImage | Blob | string | null,
  options?: { signal?: AbortSignal },
): Promise<CensusResult> {
  const analysisId = `MUDI-${String(++analysisInvocationCount).padStart(3, "0")}`;
  console.log(`[MUDI DEBUG] Analysis ID: ${analysisId}`);
  console.log(`[MUDI DEBUG] Analyze button triggered`);

  const targetImage = image ?? activeCapturedImage;
  if (!targetImage) {
    console.error(`[MUDI DEBUG ERROR] Analysis ID: ${analysisId} - No target image available for analysis`);
    throw new Error("No image provided for analysis");
  }

  // 1. Prepare image
  let imageBase64: string;
  let imageWidth = 1280;
  let imageHeight = 960;
  let fingerprint = "";

  try {
    imageBase64 = await toBase64(targetImage);
    fingerprint = getImageFingerprint(imageBase64);

    if (typeof targetImage === "object" && targetImage !== null && "width" in targetImage) {
      imageWidth = targetImage.width;
      imageHeight = targetImage.height;
    }

    console.log(`[MUDI DEBUG] Analysis ID: ${analysisId}`);
    console.log(`[MUDI DEBUG] Image fingerprint: ${fingerprint}`);
    console.log(`[MUDI DEBUG] MIME type: image/jpeg`);
    console.log(`[MUDI DEBUG] Image width: ${imageWidth}`);
    console.log(`[MUDI DEBUG] Image height: ${imageHeight}`);
    console.log(`[MUDI DEBUG] Base64 length: ${imageBase64.length}`);
  } catch (prepErr) {
    console.error(`[MUDI DEBUG ERROR] Analysis ID: ${analysisId} - Failed preparing image base64:`, prepErr);
    throw prepErr;
  }

  // 2. Call Gemini server function
  console.log(`[MUDI DEBUG] Analysis ID: ${analysisId} - About to call Gemini server function`);
  latestGeminiDebugResponse = { received: false, analysisId, fingerprint };

  let geminiRes: GeminiAnalysisResponse;
  try {
    geminiRes = await analyzeHairWithGemini({ data: { imageBase64, analysisId } });
    console.log(`[MUDI DEBUG] Analysis ID: ${analysisId} - Gemini server function returned`);
  } catch (serverErr: any) {
    console.error(`[MUDI DEBUG ERROR] Analysis ID: ${analysisId} - Gemini server function error:`, serverErr);
    latestGeminiDebugResponse = {
      received: true,
      analysisId,
      fingerprint,
      error: serverErr?.message || "Server function error",
    };
    throw serverErr;
  }

  // 3. Receive result on client
  console.log(`[MUDI DEBUG] Analysis ID: ${analysisId} - Result received by client:`, geminiRes);
  latestGeminiDebugResponse = {
    received: true,
    analysisId,
    fingerprint,
    data: geminiRes,
  };

  console.log(`[MUDI DEBUG] Analysis ID: ${analysisId} - About to display result`);

  // Map Gemini response to CensusResult format
  const coverage = Math.min(Math.max(Number(geminiRes.hairCoverage) || 0, 0), 100);
  const exposure = Number((100 - coverage).toFixed(1));
  const confidence = Math.min(Math.max(Number(geminiRes.confidence) || 0, 0), 100);

  // Compute transparent deterministic population estimate
  const { hairPopulation, populationMargin } = estimateHairPopulation(coverage, confidence, analysisId);

  let classification: Classification = "DRY LAND";
  if (coverage > 80) classification = "DENSE FOREST";
  else if (coverage > 60) classification = "WOODLAND";
  else if (coverage > 40) classification = "GRASSLAND";
  else if (coverage > 20) classification = "DRY LAND";
  else if (coverage > 5) classification = "DESERT";
  else classification = "MOON SURFACE";

  const todayStr = new Date().toISOString().split("T")[0] ?? "2026-09-12";

  const finalResult: CensusResult = {
    ...MOCK_RESULT,
    censusNumber: `MU-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    issuedAt: todayStr,
    hairPopulation,
    populationMargin,
    hairCoverage: Number(coverage.toFixed(1)),
    scalpExposure: exposure,
    baldnessIndex: exposure,
    confidence: Number(confidence.toFixed(1)),
    classification,
    classificationNote: geminiRes.notes || "Analysis completed by Gemini Vision AI.",
    verdict: geminiRes.headDetected
      ? `Head detected. ${geminiRes.notes}`
      : "No distinct head/scalp structure identified.",
  };

  setLatestResult(finalResult);
  return finalResult;
}
