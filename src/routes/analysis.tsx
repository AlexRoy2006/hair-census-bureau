import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/census/SiteHeader";
import { ScanVisualization } from "@/components/census/ScanVisualization";
import { MetaStrip } from "@/components/census/MetaStrip";
import { ANALYSIS_TELEMETRY } from "@/data/census";
import { analyzeHair, getCapturedImage, getGeminiDebugInfo } from "@/services/hairAnalysis";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Census In Progress — MUDI UNDO?" },
      {
        name: "description",
        content: "Segmenting scalp regions and estimating follicle population under census protocol MU-01.",
      },
      { property: "og:title", content: "Census In Progress — MUDI UNDO?" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AnalysisPage,
});

const DEBUG_STAGES = [
  { id: "prepare", label: "PREPARING IMAGE FRAME", at: 300 },
  { id: "gemini", label: "WAITING FOR GEMINI RESULT...", at: 1500 },
  { id: "finalize", label: "FINALIZING CENSUS REPORT", at: 2500 },
];

function AnalysisPage() {
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [stageLabel, setStageLabel] = useState("WAITING FOR GEMINI RESULT...");
  const [debugInfo, setDebugInfo] = useState<{ received: boolean; data?: any; error?: string }>({ received: false });

  const capturedImage = getCapturedImage();
  const previewUrl =
    capturedImage && typeof capturedImage === "object" && "dataUrl" in capturedImage
      ? capturedImage.dataUrl
      : typeof capturedImage === "string"
        ? capturedImage
        : null;

  const analysisStartedRef = useRef(false);

  useEffect(() => {
    // Ensure analysis is strictly invoked ONCE
    if (analysisStartedRef.current) return;
    analysisStartedRef.current = true;

    const startedAt = performance.now();
    let rafId = 0;

    const tick = () => {
      setElapsed(performance.now() - startedAt);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const controller = new AbortController();

    async function runPipeline() {
      try {
        const result = await analyzeHair(capturedImage, { signal: controller.signal });
        setStageLabel("GEMINI RESULT RECEIVED");
        setDebugInfo(getGeminiDebugInfo());

        // Short pause to ensure user sees completion status before navigation
        setTimeout(() => {
          navigate({ to: "/results" });
        }, 1200);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[MUDI DEBUG ERROR] Analysis execution failed:", err);
          setDebugInfo(getGeminiDebugInfo());
        }
      }
    }

    runPipeline();

    return () => {
      cancelAnimationFrame(rafId);
      controller.abort();
    };
  }, [capturedImage, navigate]);

  const progress = Math.min(elapsed / 3000, 1);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader context="CENSUS ENGINE / MU-VISION" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="label-tech flex items-center justify-between">
          <span>STEP 03 OF 03</span>
          <span className="num-tabular">{Math.round(progress * 100)}% COMPLETE</span>
        </div>

        <h1 className="wordmark mt-3 text-3xl sm:text-4xl">CENSUS IN PROGRESS</h1>

        <div className="mt-4 h-1 w-full overflow-hidden border border-hairline bg-secondary">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="border border-hairline bg-paper p-2 sm:p-3">
            <div className="label-tech mb-2 flex items-center justify-between px-1">
              <span>SEGMENTATION VIEW</span>
              <span className="animate-blip">● SCANNING</span>
            </div>
            <ScanVisualization scanning previewUrl={previewUrl} />
          </div>

          <div className="min-w-0">
            <ol className="divide-y divide-border border border-border bg-paper">
              {DEBUG_STAGES.map((stage) => {
                const isGeminiStage = stage.id === "gemini";
                const displayLabel = isGeminiStage ? stageLabel : stage.label;
                const isDone = debugInfo.received || elapsed >= stage.at;

                return (
                  <li
                    key={stage.id}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3.5 transition-colors",
                      isGeminiStage && !debugInfo.received && "bg-accent/40",
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 shrink-0 text-center font-mono text-xs",
                        isDone ? "text-primary" : "animate-blip text-primary",
                      )}
                      aria-hidden
                    >
                      {isDone ? "✓" : "→"}
                    </span>
                    <span className="min-w-0 font-mono text-[0.72rem] tracking-[0.14em] uppercase text-foreground">
                      {displayLabel}
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* Development-only Gemini Debug Panel */}
            <div className="mt-4 border border-border bg-paper p-4 font-mono text-xs space-y-1">
              <div className="font-bold text-primary tracking-widest uppercase mb-2">
                GEMINI DEBUG PANEL
              </div>
              <div>
                Server response received:{" "}
                <span className={debugInfo.received ? "text-primary font-bold" : "text-muted-foreground"}>
                  {debugInfo.received ? "YES" : "NO (WAITING...)"}
                </span>
              </div>
              {debugInfo.error && <div className="text-destructive">Error: {debugInfo.error}</div>}
              {debugInfo.data && (
                <div className="mt-2 space-y-1 border-t border-hairline pt-2">
                  <div>headDetected: <span className="font-bold">{String(debugInfo.data.headDetected)}</span></div>
                  <div>hairCoverage: <span className="font-bold">{debugInfo.data.hairCoverage}%</span></div>
                  <div>confidence: <span className="font-bold">{debugInfo.data.confidence}%</span></div>
                  <div>notes: <span className="italic">{debugInfo.data.notes}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <MetaStrip
          className="mt-8"
          items={[
            { label: "MODEL", value: ANALYSIS_TELEMETRY.model },
            { label: "FRAME RATE", value: ANALYSIS_TELEMETRY.frameRate },
            { label: "MODE", value: "GEMINI VISION PIPELINE" },
            { label: "PROTOCOL", value: "MU-01" },
          ]}
        />
      </main>
    </div>
  );
}
