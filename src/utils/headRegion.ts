/**
 * HEAD & SCALP REGION EXTRACTION UTILITY
 * -----------------------------------------------------------------------------
 * Isolates the head and scalp region from face-parsing segmentation outputs.
 * Excludes background, clothing, neck, and unrelated objects.
 */

export interface SegmentationClassMask {
  label: string;
  width: number;
  height: number;
  mask: Uint8Array | Float32Array | Uint8ClampedArray; // 1 = present, 0 = absent
}

export interface HeadRegionOutput {
  width: number;
  height: number;
  headMask: Uint8Array; // 1 = inside head region, 0 = background/clothes
  totalHeadPixels: number;
  hasUsableHead: boolean; // True if a clear head region is detected
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  headPixelRatio: number; // Ratio of image covered by head (0.0 - 1.0)
}

/**
 * Head-related semantic class labels from face-parsing models (CelebAMask-HQ 19-class vocabulary).
 */
const HEAD_FEATURE_LABELS = new Set([
  "hair",
  "skin",
  "face",
  "l_brow",
  "r_brow",
  "l_eye",
  "r_eye",
  "eye_g",
  "l_ear",
  "r_ear",
  "ear_r",
  "nose",
  "mouth",
  "u_lip",
  "l_lip",
  "scalp",
  "forehead",
]);

/**
 * Compute the precise head region mask and pixel metrics from segmentation outputs.
 *
 * Performance note: this function is synchronous and iterates masks × W × H pixels.
 * At CV_RESOLUTION (256×256) with 6 masks = ~393K iterations — fast (<5ms).
 * This should NEVER be called with full-resolution image dimensions.
 */
export function extractHeadRegion(
  masks: SegmentationClassMask[],
  imageWidth: number,
  imageHeight: number,
): HeadRegionOutput {
  console.log(`[MUDI HEAD DEBUG] extractHeadRegion called — dimensions: ${imageWidth}x${imageHeight}, masks: ${masks.length}`);
  const startTime = Date.now();

  const totalPixels = imageWidth * imageHeight;
  const headMask = new Uint8Array(totalPixels);

  let minX = imageWidth;
  let minY = imageHeight;
  let maxX = 0;
  let maxY = 0;
  let featurePixelCount = 0;

  let eyeBrowsMinY = imageHeight;
  let chinMaxY = 0;

  // 1. Accumulate all face/head/hair semantic class pixels
  for (const classMask of masks) {
    const label = classMask.label.toLowerCase();
    if (
      !HEAD_FEATURE_LABELS.has(label) &&
      !label.includes("hair") &&
      !label.includes("skin") &&
      !label.includes("face")
    ) {
      continue;
    }

    const m = classMask.mask;
    const maskW = classMask.width || imageWidth;
    const maskH = classMask.height || imageHeight;

    for (let y = 0; y < imageHeight; y++) {
      for (let x = 0; x < imageWidth; x++) {
        const idx = y * imageWidth + x;

        // Handle mask dimensions that may differ from image dimensions
        const mx = Math.min(maskW - 1, Math.floor((x / imageWidth) * maskW));
        const my = Math.min(maskH - 1, Math.floor((y / imageHeight) * maskH));
        const mIdx = my * maskW + mx;

        if (m[mIdx] > 0) {
          if (headMask[idx] === 0) {
            headMask[idx] = 1;
            featurePixelCount++;

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }

          if (label.includes("brow") || label.includes("eye")) {
            if (y < eyeBrowsMinY) eyeBrowsMinY = y;
          }
          if (
            label.includes("mouth") ||
            label.includes("lip") ||
            label.includes("chin") ||
            label.includes("skin")
          ) {
            if (y > chinMaxY) chinMaxY = y;
          }
        }
      }
    }
  }

  console.log(`[MUDI HEAD DEBUG] Head feature pixels accumulated: ${featurePixelCount}`);
  console.log(`[MUDI HEAD DEBUG] Bounding box: (${minX},${minY}) → (${maxX},${maxY})`);
  console.log(`[MUDI HEAD DEBUG] Eyebrow minY: ${eyeBrowsMinY}, Chin maxY: ${chinMaxY}`);

  // 2. Scalp Region Proxy Fallback for Sparse Hair / Bald Subjects
  // If hair pixels are minimal, project the cranial dome upward from eyebrows
  if (featurePixelCount > 0 && eyeBrowsMinY < imageHeight && chinMaxY > eyeBrowsMinY) {
    const faceHeight = chinMaxY - eyeBrowsMinY;
    const estimatedTopVertexY = Math.max(0, Math.floor(eyeBrowsMinY - faceHeight * 0.85));
    const headWidth = Math.max(20, maxX - minX);
    const centerX = Math.floor((minX + maxX) / 2);
    const radiusX = Math.floor(headWidth / 2);

    for (let y = estimatedTopVertexY; y < minY; y++) {
      const normalizedY = (y - estimatedTopVertexY) / (minY - estimatedTopVertexY || 1);
      const currentRadius = Math.floor(
        radiusX * Math.sqrt(Math.max(0, 1 - Math.pow(1 - normalizedY, 2))),
      );

      const startX = Math.max(0, centerX - currentRadius);
      const endX = Math.min(imageWidth - 1, centerX + currentRadius);

      for (let x = startX; x <= endX; x++) {
        const idx = y * imageWidth + x;
        if (headMask[idx] === 0) {
          headMask[idx] = 1;
          featurePixelCount++;
        }
      }
    }

    if (estimatedTopVertexY < minY) {
      minY = estimatedTopVertexY;
    }
  }

  const headPixelRatio = featurePixelCount / (totalPixels || 1);

  /**
   * USABLE HEAD THRESHOLD
   * At 256×256 = 65,536 total pixels.
   * We require at least 0.5% of pixels to be head-related features, OR
   * at least 300 pixels detected (a very permissive minimum).
   * The old threshold of > 2500 AND >= 3% was too strict for bald/low-contrast subjects.
   *
   * 0.5% of 256×256 = ~328 pixels — permissive but prevents false positives on blank images.
   */
  const MIN_HEAD_PIXELS = Math.max(300, Math.round(totalPixels * 0.005));
  const MIN_HEAD_RATIO = 0.005;
  const hasUsableHead = featurePixelCount >= MIN_HEAD_PIXELS && headPixelRatio >= MIN_HEAD_RATIO;

  const elapsedMs = Date.now() - startTime;
  console.log(`[MUDI HEAD DEBUG] Head detection time: ${elapsedMs}ms`);
  console.log(`[MUDI HEAD DEBUG] Total head pixels: ${featurePixelCount} (threshold: ${MIN_HEAD_PIXELS})`);
  console.log(`[MUDI HEAD DEBUG] Head pixel ratio: ${(headPixelRatio * 100).toFixed(2)}% (threshold: ${(MIN_HEAD_RATIO * 100).toFixed(1)}%)`);
  console.log(`[MUDI HEAD DEBUG] hasUsableHead: ${hasUsableHead}`);

  const safeMinX = featurePixelCount > 0 ? Math.min(minX, maxX) : 0;
  const safeMinY = featurePixelCount > 0 ? Math.min(minY, maxY) : 0;
  const safeMaxX = featurePixelCount > 0 ? maxX : imageWidth;
  const safeMaxY = featurePixelCount > 0 ? maxY : imageHeight;

  const boundingBox = {
    minX: safeMinX,
    minY: safeMinY,
    maxX: safeMaxX,
    maxY: safeMaxY,
    width: Math.max(1, safeMaxX - safeMinX),
    height: Math.max(1, safeMaxY - safeMinY),
  };

  return {
    width: imageWidth,
    height: imageHeight,
    headMask,
    totalHeadPixels: Math.max(1, featurePixelCount),
    hasUsableHead,
    boundingBox,
    headPixelRatio: Math.round(headPixelRatio * 1000) / 1000,
  };
}
