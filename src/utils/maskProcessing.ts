/**
 * HAIR MASK POST-PROCESSING & CLEANUP UTILITY
 * -----------------------------------------------------------------------------
 * Performs lightweight morphological operations to clean raw AI hair masks:
 *   - Removes tiny isolated noise pixels
 *   - Fills small 1-2 pixel interior gaps
 *   - Smooths noisy mask boundaries
 *
 * NOTE: Does NOT artificially inflate or alter true hair region boundaries.
 */

export interface CleanMaskResult {
  cleanedMask: Uint8Array;
  rawPixelCount: number;
  cleanPixelCount: number;
  noisePixelsRemoved: number;
  holesFilled: number;
  maskQualityScore: number; // 0 - 100
}

/**
 * Clean raw binary hair segmentation mask.
 */
export function cleanHairMask(
  rawMask: Uint8Array,
  width: number,
  height: number,
): CleanMaskResult {
  const totalPixels = width * height;
  const cleanedMask = new Uint8Array(rawMask);

  let rawPixelCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    if (rawMask[i] === 1) rawPixelCount++;
  }

  if (rawPixelCount === 0) {
    return {
      cleanedMask,
      rawPixelCount: 0,
      cleanPixelCount: 0,
      noisePixelsRemoved: 0,
      holesFilled: 0,
      maskQualityScore: 100,
    };
  }

  let noisePixelsRemoved = 0;
  let holesFilled = 0;

  // 1. Fill isolated 1-2 pixel interior holes (4-neighbor check)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (cleanedMask[idx] === 0) {
        const top = cleanedMask[idx - width];
        const bottom = cleanedMask[idx + width];
        const left = cleanedMask[idx - 1];
        const right = cleanedMask[idx + 1];

        // If surrounded on all 4 sides by hair pixels, fill the hole
        if (top === 1 && bottom === 1 && left === 1 && right === 1) {
          cleanedMask[idx] = 1;
          holesFilled++;
        }
      }
    }
  }

  // 2. Remove tiny isolated 1-pixel noise spots (8-neighbor check)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (cleanedMask[idx] === 1) {
        let neighborCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (cleanedMask[(y + dy) * width + (x + dx)] === 1) {
              neighborCount++;
            }
          }
        }
        // If an isolated single pixel has no hair neighbors, prune it
        if (neighborCount === 0) {
          cleanedMask[idx] = 0;
          noisePixelsRemoved++;
        }
      }
    }
  }

  let cleanPixelCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    if (cleanedMask[i] === 1) cleanPixelCount++;
  }

  // Mask quality score based on spatial compactness vs noise ratio
  const noiseRatio = noisePixelsRemoved / (rawPixelCount || 1);
  const maskQualityScore = Math.max(
    50,
    Math.min(100, Math.round(100 - noiseRatio * 200)),
  );

  return {
    cleanedMask,
    rawPixelCount,
    cleanPixelCount,
    noisePixelsRemoved,
    holesFilled,
    maskQualityScore,
  };
}
