import { createServerFn } from "@tanstack/react-start";
import { getImageFingerprint } from "./imageProcessor";

export interface GeminiAnalysisResponse {
  headDetected: boolean;
  hairCoverage: number;
  confidence: number;
  notes: string;
}

interface InternalFetchResult {
  ok: boolean;
  status: number;
  data?: GeminiAnalysisResponse;
  error?: string;
  isRetryable: boolean;
}

const CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const REQUEST_TIMEOUT_MS = 20000; // 20 seconds max timeout per attempt

/**
 * Execute single Gemini API call with a 20-second timeout and no-store cache policy.
 * Never logs or exposes secret API keys.
 */
async function requestGemini(
  imageBase64: string,
  apiKey: string,
  keyLabel: "primary" | "backup",
  analysisId: string,
): Promise<InternalFetchResult> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const promptText = `Analyze this head and scalp image for a hair census. Return JSON matching:
{
  "headDetected": boolean (true if human head/scalp is visible),
  "hairCoverage": number (estimated percentage 0-100 of scalp covered by hair),
  "confidence": number (confidence level 0-100 of measurement),
  "notes": string (brief summary observation)
}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          headDetected: { type: "BOOLEAN" },
          hairCoverage: { type: "NUMBER" },
          confidence: { type: "NUMBER" },
          notes: { type: "STRING" },
        },
        required: ["headDetected", "hairCoverage", "confidence", "notes"],
      },
    },
  };

  for (const modelName of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          return {
            ok: false,
            status: 500,
            error: "Empty content returned from Gemini",
            isRetryable: true,
          };
        }

        const parsed: GeminiAnalysisResponse = JSON.parse(rawText);

        // Normalize response values to valid numbers
        parsed.hairCoverage = Number(parsed.hairCoverage) || 0;
        parsed.confidence = Number(parsed.confidence) || 0;

        console.log(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId}`);
        console.log(`[MUDI GEMINI SERVER] Model: ${modelName}`);
        console.log(`[MUDI GEMINI SERVER] headDetected: ${parsed.headDetected}`);
        console.log(`[MUDI GEMINI SERVER] hairCoverage: ${parsed.hairCoverage}`);
        console.log(`[MUDI GEMINI SERVER] confidence: ${parsed.confidence}`);

        return {
          ok: true,
          status: 200,
          data: parsed,
          isRetryable: false,
        };
      }

      const status = res.status;
      const errorText = await res.text().catch(() => "");
      const isRetryable = status === 401 || status === 403 || status === 429 || status >= 500;

      console.warn(
        `[MUDI GEMINI] Analysis ID: ${analysisId} | ${keyLabel} key attempt with model ${modelName} returned status ${status} (retryable: ${isRetryable})`,
      );

      if (status === 429) {
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!isRetryable) {
        return {
          ok: false,
          status,
          error: `Gemini client request error (${status})`,
          isRetryable: false,
        };
      }
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err?.name === "AbortError";
      console.warn(
        `[MUDI GEMINI] Analysis ID: ${analysisId} | ${keyLabel} key error (${modelName}): ${isAbort ? "Timed out (20s)" : err?.message || err}`,
      );
    }
  }

  return {
    ok: false,
    status: 503,
    error: `All candidate models failed for ${keyLabel} key`,
    isRetryable: true,
  };
}

/**
 * Public TanStack Start Server Function for Hair Analysis.
 * Receives imageBase64 & analysisId and logs exact fingerprint matching.
 */
export const analyzeHairWithGemini = createServerFn({ method: "POST" })
  .validator((data: { imageBase64: string; analysisId?: string }) => data)
  .handler(async ({ data }) => {
    const analysisId = data.analysisId || `MUDI-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log(`[MUDI GEMINI SERVER] Handler entered`);
    console.log(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId}`);

    const primaryKey = process.env["GEMINI_API_KEY"];
    const backupKey = process.env["GEMINI_API_KEY_BACKUP"];

    if (!primaryKey && !backupKey) {
      console.error(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - Neither primary nor backup API key exists!`);
      throw new Error("Gemini API key is not configured on the server");
    }

    if (!data || !data.imageBase64) {
      console.error(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - Missing imageBase64 payload`);
      throw new Error("Missing imageBase64 payload");
    }

    const fingerprint = getImageFingerprint(data.imageBase64);
    console.log(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId}`);
    console.log(`[MUDI GEMINI SERVER] Base64 length: ${data.imageBase64.length}`);
    console.log(`[MUDI GEMINI SERVER] Image fingerprint: ${fingerprint}`);

    if (process.env["DEV_GEMINI_BYPASS"] === "true") {
      console.log(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - DEV_GEMINI_BYPASS active`);
      return {
        headDetected: true,
        hairCoverage: 78.4,
        confidence: 84.7,
        notes: "Development bypass response",
      };
    }

    // Attempt 1: Primary API Key
    if (primaryKey) {
      console.log(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - Using primary key`);

      const primaryResult = await requestGemini(data.imageBase64, primaryKey, "primary", analysisId);
      if (primaryResult.ok && primaryResult.data) {
        return primaryResult.data;
      }

      console.warn(
        `[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - Primary request failed with status ${primaryResult.status} (retryable: ${primaryResult.isRetryable})`,
      );

      // Attempt 2: Backup API Key Fallback
      if (primaryResult.isRetryable && backupKey && backupKey !== primaryKey) {
        console.log(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - Falling back to backup key`);

        const backupResult = await requestGemini(data.imageBase64, backupKey, "backup", analysisId);
        if (backupResult.ok && backupResult.data) {
          console.log(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - Backup request succeeded`);
          return backupResult.data;
        }

        console.error(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - Backup key request failed with status ${backupResult.status}`);
      }
    } else if (backupKey) {
      console.log(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - Primary key unavailable. Using backup key directly`);
      const backupResult = await requestGemini(data.imageBase64, backupKey, "backup", analysisId);
      if (backupResult.ok && backupResult.data) {
        return backupResult.data;
      }
    }

    console.error(`[MUDI GEMINI SERVER] Analysis ID: ${analysisId} - Execution failed across all available keys`);
    throw new Error("Hair analysis service is temporarily unavailable. Please try again.");
  });
