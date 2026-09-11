import { analyzeHair as serviceAnalyzeHair } from "@/services/hairAnalysis";
import type { CensusResult } from "@/data/census";

/**
 * Single seam where the browser-based computer-vision pipeline connects.
 * Delegates directly to src/services/hairAnalysis.ts.
 */
export async function analyzeHair(
  image?: Blob | string | null,
  options?: { signal?: AbortSignal },
): Promise<CensusResult> {
  return serviceAnalyzeHair(image, options);
}
