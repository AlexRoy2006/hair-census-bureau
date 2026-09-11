/**
 * LOCAL BROWSER IMAGE PREPROCESSING SERVICE
 * -----------------------------------------------------------------------------
 * All image operations happen 100% locally in the browser memory. No images
 * are ever uploaded to any external server or API.
 */

export interface PreparedImage {
  canvas: HTMLCanvasElement;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  sizeBytes: number;
}

export interface PrepareOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

const DEFAULT_PREPARE_OPTIONS: PrepareOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.92,
  mimeType: "image/jpeg",
};

/**
 * Reusable image preprocessing function suitable for local model inference.
 * Accepts File, Blob, HTMLImageElement, HTMLVideoElement, HTMLCanvasElement, PreparedImage, or dataUrl string.
 */
export async function prepareImage(
  image?: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | Blob | File | string | PreparedImage | any,
  options: PrepareOptions = {},
): Promise<PreparedImage> {
  const opts = { ...DEFAULT_PREPARE_OPTIONS, ...options };

  try {
    let sourceCanvas: HTMLCanvasElement;

    if (!image) {
      throw new Error("No image provided for processing");
    } else if (typeof image === "object" && "canvas" in image && image.canvas instanceof HTMLCanvasElement) {
      // Already a PreparedImage object with canvas
      sourceCanvas = image.canvas;
    } else if (typeof image === "object" && "dataUrl" in image && typeof image.dataUrl === "string") {
      sourceCanvas = await dataUrlToCanvas(image.dataUrl);
    } else if (typeof image === "object" && "blob" in image && image.blob instanceof Blob) {
      sourceCanvas = await blobToCanvas(image.blob);
    } else if (typeof image === "string") {
      sourceCanvas = await dataUrlToCanvas(image);
    } else if (typeof window !== "undefined" && image instanceof HTMLVideoElement) {
      sourceCanvas = videoToCanvas(image);
    } else if (typeof window !== "undefined" && image instanceof HTMLCanvasElement) {
      sourceCanvas = image;
    } else if (typeof window !== "undefined" && image instanceof HTMLImageElement) {
      sourceCanvas = imageToCanvas(image);
    } else if (typeof window !== "undefined" && (image instanceof Blob || image instanceof File)) {
      sourceCanvas = await blobToCanvas(image);
    } else {
      throw new Error("Unsupported image format provided");
    }

    return await resizeAndNormalizeCanvas(sourceCanvas, opts);
  } catch (err: any) {
    console.error("[MUDI DEBUG] Image preprocessing error:", err);
    throw err;
  }
}

/**
 * Alias wrapper for backward compatibility with capture pipeline.
 */
export async function processCapturedImage(
  source: HTMLVideoElement | HTMLCanvasElement | Blob | File | string | PreparedImage | any,
  options: PrepareOptions = {},
) {
  return prepareImage(source, options);
}

function createFallbackCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 640, 800);
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.arc(320, 350, 180, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

function videoToCanvas(video: HTMLVideoElement): HTMLCanvasElement {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context for video frame");

  ctx.drawImage(video, 0, 0, width, height);
  return canvas;
}

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context for HTMLImageElement");

  ctx.drawImage(img, 0, 0);
  return canvas;
}

function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = imageToCanvas(img);
        resolve(canvas);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to decode image file/blob into HTMLImageElement"));
    };

    img.src = url;
  });
}

function dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = imageToCanvas(img);
        resolve(canvas);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Invalid or corrupted data URL provided"));
    img.src = dataUrl;
  });
}

function resizeAndNormalizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  opts: PrepareOptions,
): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    let targetWidth = sourceCanvas.width;
    let targetHeight = sourceCanvas.height;

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
      return reject(new Error("Could not initialize 2D output canvas context"));
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, targetWidth, targetHeight);

    const mimeType = opts.mimeType || "image/jpeg";
    const quality = opts.quality ?? 0.92;

    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error("Failed to export processed canvas to Blob"));
        }
        const dataUrl = outputCanvas.toDataURL(mimeType, quality);
        resolve({
          canvas: outputCanvas,
          blob,
          dataUrl,
          width: targetWidth,
          height: targetHeight,
          aspectRatio: targetWidth / (targetHeight || 1),
          sizeBytes: blob.size,
        });
      },
      mimeType,
      quality,
    );
  });
}
