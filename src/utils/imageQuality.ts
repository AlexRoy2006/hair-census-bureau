/**
 * IMAGE QUALITY VALIDATION UTILITY
 * -----------------------------------------------------------------------------
 * Evaluates basic image quality metrics (resolution, luminance, contrast, blur)
 * client-side before computer-vision inference.
 */

export interface ImageQualityResult {
  valid: boolean;
  score: number; // 0 - 100
  issues: string[];
  luminance: number; // 0 - 255
  blurScore: number;
  overexposedRatio: number;
  underexposedRatio: number;
}

/**
 * Validates image quality from an HTMLCanvasElement or ImageData.
 */
export function validateImageQuality(
  canvas: HTMLCanvasElement | ImageData,
): ImageQualityResult {
  let width = 0;
  let height = 0;
  let imgData: ImageData;

  if (canvas instanceof HTMLCanvasElement) {
    width = canvas.width;
    height = canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        valid: true,
        score: 80,
        issues: [],
        luminance: 128,
        blurScore: 50,
        overexposedRatio: 0,
        underexposedRatio: 0,
      };
    }
    imgData = ctx.getImageData(0, 0, width, height);
  } else {
    width = canvas.width;
    height = canvas.height;
    imgData = canvas;
  }

  const pixels = imgData.data;
  const totalPixels = width * height;
  const issues: string[] = [];

  // 1. Resolution Check
  if (width < 120 || height < 120) {
    issues.push("EXTREMELY_LOW_RESOLUTION");
  }

  let totalLuminance = 0;
  let overexposedCount = 0;
  let underexposedCount = 0;

  // Grayscale array for blur variance computation
  const gray = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const p = i * 4;
    const r = pixels[p]!;
    const g = pixels[p + 1]!;
    const b = pixels[p + 2]!;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = lum;
    totalLuminance += lum;

    if (lum > 245) overexposedCount++;
    if (lum < 20) underexposedCount++;
  }

  const avgLuminance = Math.round(totalLuminance / (totalPixels || 1));
  const overexposedRatio = overexposedCount / (totalPixels || 1);
  const underexposedRatio = underexposedCount / (totalPixels || 1);

  if (avgLuminance < 30 || underexposedRatio > 0.6) {
    issues.push("EXCESSIVE_DARKNESS");
  }
  if (avgLuminance > 230 || overexposedRatio > 0.4) {
    issues.push("EXCESSIVE_BRIGHTNESS");
  }

  // 2. Blur Estimation via 3x3 Laplacian Kernel Variance
  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let sampleCount = 0;

  // Downsample step for fast blur detection
  const step = Math.max(1, Math.floor(Math.min(width, height) / 160));

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = y * width + x;
      // 3x3 Laplacian operator: [0, 1, 0; 1, -4, 1; 0, 1, 0]
      const lap =
        gray[idx - width]! +
        gray[idx - 1]! +
        gray[idx + 1]! +
        gray[idx + width]! -
        4 * gray[idx]!;

      laplacianSum += lap;
      laplacianSqSum += lap * lap;
      sampleCount++;
    }
  }

  const meanLap = laplacianSum / (sampleCount || 1);
  const blurScore = Math.round(
    Math.max(0, laplacianSqSum / (sampleCount || 1) - meanLap * meanLap),
  );

  if (blurScore < 12) {
    issues.push("IMAGE_BLURRY");
  }

  // 3. Compute Overall Quality Score (0 to 100)
  let qualityScore = 100;

  if (avgLuminance < 40) qualityScore -= 20;
  if (avgLuminance > 220) qualityScore -= 15;
  if (blurScore < 20) qualityScore -= 15;
  if (overexposedRatio > 0.3) qualityScore -= 15;
  if (underexposedRatio > 0.5) qualityScore -= 20;

  qualityScore = Math.max(20, Math.min(100, qualityScore));

  // Image is marked invalid only if it is genuinely unusable (e.g. pitch black or tiny 50px snippet)
  const valid = totalPixels >= 100 * 100 && avgLuminance >= 10;

  return {
    valid,
    score: qualityScore,
    issues,
    luminance: avgLuminance,
    blurScore,
    overexposedRatio: Math.round(overexposedRatio * 100) / 100,
    underexposedRatio: Math.round(underexposedRatio * 100) / 100,
  };
}
