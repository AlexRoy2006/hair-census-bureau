/**
 * IMAGE PROCESSING SERVICE
 * -----------------------------------------------------------------------------
 * Reusable utility for handling, resizing, and normalizing captured or uploaded
 * images for the hair census computer-vision pipeline.
 */

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  fingerprint: string;
}

export interface ProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

const DEFAULT_OPTIONS: ProcessOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.9,
  mimeType: "image/jpeg",
};

/**
 * Generate a non-secret deterministic image fingerprint.
 */
export function getImageFingerprint(base64Str: string): string {
  if (!base64Str) return "FP-EMPTY";
  const clean = base64Str.replace(/^data:image\/\w+;base64,/, "");
  let hash = 0;
  const len = clean.length;
  const step = Math.max(1, Math.floor(len / 128));

  for (let i = 0; i < len; i += step) {
    hash = ((hash << 5) - hash + clean.charCodeAt(i)) | 0;
  }

  const sample =
    clean.substring(0, 4) +
    clean.substring(Math.floor(len / 2), Math.floor(len / 2) + 4) +
    clean.substring(Math.max(0, len - 4));

  return `FP-${len}-${(hash >>> 0).toString(16).toUpperCase()}-${sample}`;
}

/**
 * Process a video frame, canvas, blob, or file into a normalized image blob & dataUrl.
 */
export async function processCapturedImage(
  source: HTMLVideoElement | HTMLCanvasElement | Blob | File | string,
  options: ProcessOptions = {},
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (typeof source === "string") {
    return processDataUrl(source, opts);
  }

  if (typeof HTMLVideoElement !== "undefined" && source instanceof HTMLVideoElement) {
    return processVideoFrame(source, opts);
  }

  if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
    return processCanvas(source, opts);
  }

  if (typeof Blob !== "undefined" && source instanceof Blob) {
    return processBlob(source, opts);
  }

  throw new Error("Unsupported image source provided to imageProcessor");
}

function processVideoFrame(video: HTMLVideoElement, opts: ProcessOptions): Promise<ProcessedImage> {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas 2D context");
  }

  ctx.drawImage(video, 0, 0, width, height);
  return processCanvas(canvas, opts);
}

function processBlob(blob: Blob, opts: ProcessOptions): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = async () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not create canvas 2D context");
        }
        ctx.drawImage(img, 0, 0);

        const result = await processCanvas(canvas, opts);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image blob into Image element"));
    };

    img.src = url;
  });
}

function processDataUrl(dataUrl: string, opts: ProcessOptions): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not create canvas 2D context");
        }
        ctx.drawImage(img, 0, 0);

        const result = await processCanvas(canvas, opts);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load data URL"));
    img.src = dataUrl;
  });
}

function processCanvas(canvas: HTMLCanvasElement, opts: ProcessOptions): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    let targetWidth = canvas.width;
    let targetHeight = canvas.height;

    const maxW = opts.maxWidth || 1920;
    const maxH = opts.maxHeight || 1920;

    if (targetWidth > maxW || targetHeight > maxH) {
      const ratio = Math.min(maxW / targetWidth, maxH / targetHeight);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = targetWidth;
    outputCanvas.height = targetHeight;

    const ctx = outputCanvas.getContext("2d");
    if (!ctx) {
      return reject(new Error("Could not create canvas context for output"));
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidth, targetHeight);

    const mimeType = opts.mimeType || "image/jpeg";
    const quality = opts.quality ?? 0.9;

    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error("Failed to generate image blob from canvas"));
        }
        const dataUrl = outputCanvas.toDataURL(mimeType, quality);
        const fingerprint = getImageFingerprint(dataUrl);

        resolve({
          blob,
          dataUrl,
          width: targetWidth,
          height: targetHeight,
          sizeBytes: blob.size,
          fingerprint,
        });
      },
      mimeType,
      quality,
    );
  });
}
