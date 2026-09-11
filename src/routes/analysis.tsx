import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/census/SiteHeader";
import { ScanVisualization } from "@/components/census/ScanVisualization";
import { MetaStrip } from "@/components/census/MetaStrip";
import { CensusButton } from "@/components/census/CensusButton";
import { ANALYSIS_TELEMETRY } from "@/data/census";
import {
  analyzeHair,
  getCapturedImage,
  type PipelineProgress,
  type PipelineStage,
} from "@/services/hairAnalysis";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/utils/language";
import { CENSUS_MESSAGES } from "@/config/censusMessages";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Census In Progress — MUDI UNDO?" },
      {
        name: "description",
        content:
          "Segmenting scalp regions and estimating follicle population under census protocol MU-01.",
      },
      { property: "og:title", content: "Census In Progress — MUDI UNDO?" },
      {
        property: "og:description",
        content: "Scalp mapping and follicle population estimation in progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const navigate = useNavigate();
  const [lang] = useLanguage();
  const t = CENSUS_MESSAGES[lang];

  // Use PipelineStage (uppercase) — the single source of truth from hairAnalysis.ts
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("PREPARING");
  const [stageTextLabel, setStageTextLabel] = useState<string>("INITIALIZING CENSUS...");
  const [progressPercent, setProgressPercent] = useState(0);
  const [pixels, setPixels] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isRunningRef = useRef(false);
  const capturedImage = getCapturedImage();
  const previewUrl =
    capturedImage && typeof capturedImage === "object" && "dataUrl" in capturedImage
      ? capturedImage.dataUrl
      : typeof capturedImage === "string"
        ? capturedImage
        : null;

  const isError = pipelineStage === "ERROR";
  const isComplete = pipelineStage === "COMPLETE";

  const runPipeline = useCallback(async (signal: AbortSignal) => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    setErrorMessage(null);
    setPipelineStage("PREPARING");
    setProgressPercent(0);

    const totalPixels =
      capturedImage && typeof capturedImage === "object" && "width" in capturedImage
        ? capturedImage.width * capturedImage.height
        : ANALYSIS_TELEMETRY.pixelsAnalysed;

    try {
      await analyzeHair(capturedImage, {
        signal,
        onProgress: (p: PipelineProgress) => {
          if (signal.aborted) return;
          setPipelineStage(p.stage);
          setStageTextLabel(p.stageLabel);
          setProgressPercent(p.progressPercent);
          setElapsedMs(p.elapsedMs);
          setPixels(Math.round(totalPixels * (p.progressPercent / 100)));
        },
      });

      if (!signal.aborted) {
        setTimeout(() => {
          if (!signal.aborted) {
            navigate({ to: "/results" });
          }
        }, 400);
      }
    } catch (err: any) {
      if (signal.aborted) return;
      console.error("[MUDI] Analysis pipeline interrupted:", err);
      setPipelineStage("ERROR");
      setErrorMessage(
        err?.message || "Unable to analyze this image. Please try another image with better lighting.",
      );
    } finally {
      isRunningRef.current = false;
    }
  }, [capturedImage, navigate]);

  useEffect(() => {
    const controller = new AbortController();
    runPipeline(controller.signal);

    return () => {
      controller.abort();
    };
  }, []); // Run once on mount

  // Determine active stage index out of the sequential status messages based on progress
  const stages = t.stages;
  const activeStageIndex =
    isComplete
      ? stages.length - 1
      : Math.min(stages.length - 1, Math.floor((progressPercent / 100) * stages.length));

  const currentStageObj = stages[activeStageIndex];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader context="CENSUS ENGINE / MU-VISION" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="label-tech flex items-center justify-between">
          <span>{t.step03}</span>
          <span className="num-tabular">
            {isError
              ? t.censusInterrupted
              : `${Math.round(progressPercent)}${t.completePct}`}
          </span>
        </div>

        <h1 className="wordmark mt-3 text-3xl sm:text-4xl">
          {isError ? t.censusInterrupted : t.censusInProgress}
        </h1>

        <div className="mt-4 h-1 w-full overflow-hidden border border-hairline bg-secondary">
          <div
            className={cn(
              "h-full transition-[width] duration-300 ease-linear",
              isError ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${isError ? 100 : progressPercent}%` }}
          />
        </div>

        {isError ? (
          <div className="mt-6 border border-destructive/40 bg-paper p-6 text-left animate-rise">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <h2 className="wordmark text-2xl text-destructive">{t.censusInterrupted}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              {errorMessage || "Unable to analyze this image. Please try another image with better lighting."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <CensusButton
                size="lg"
                onClick={() => {
                  const controller = new AbortController();
                  runPipeline(controller.signal);
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" /> {t.retryAnalysis}
              </CensusButton>

              <CensusButton
                variant="outline"
                size="lg"
                onClick={() => navigate({ to: "/camera" })}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t.returnToCamera}
              </CensusButton>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="border border-hairline bg-paper p-2 sm:p-3">
              <div className="label-tech mb-2 flex items-center justify-between px-1">
                <span>{t.segmentationView}</span>
                <span className="animate-blip">{t.scanning}</span>
              </div>
              <ScanVisualization scanning previewUrl={previewUrl} />
            </div>

            <div className="min-w-0 flex flex-col justify-between gap-4">
              <ol className="divide-y divide-border border border-border bg-paper max-h-72 overflow-y-auto">
                {stages.map((stage, i) => {
                  const isPast = activeStageIndex > i || isComplete;
                  const isCurrent = activeStageIndex === i && !isComplete;
                  return (
                    <li
                      key={stage.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 transition-colors",
                        isCurrent && "bg-accent/50",
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 shrink-0 text-center font-mono text-xs",
                          isPast
                            ? "text-primary font-bold"
                            : isCurrent
                              ? "animate-blip text-primary font-bold"
                              : "text-muted-foreground",
                        )}
                        aria-hidden
                      >
                        {isPast ? "✓" : isCurrent ? "→" : "○"}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 font-mono text-[0.72rem] tracking-[0.1em] uppercase truncate",
                          isPast || isCurrent ? "text-foreground font-semibold" : "text-muted-foreground",
                          lang === "ml" && "font-sans text-xs tracking-normal font-medium",
                        )}
                      >
                        {stage.label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {/* Fake rotating system telemetry */}
              <div className="border border-border bg-paper p-3 text-[0.72rem] font-mono tracking-wider">
                <div className="label-tech mb-2 text-primary">{t.systemTelemetry}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-muted-foreground">
                  <div>
                    {t.censusNode}: <span className="text-foreground">MUDI-01</span>
                  </div>
                  <div>
                    {t.analysisMode}: <span className="text-foreground">HAIR-DENSITY</span>
                  </div>
                  <div>
                    {t.dataSource}: <span className="text-foreground">LOCAL CAMERA</span>
                  </div>
                  <div>
                    {t.inference}: <span className="font-semibold text-primary">{t.onDevice}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-hairline mt-1">
                    {t.status}{" "}
                    <span className="animate-blip text-primary font-bold">
                      {isComplete ? t.analysisComplete : t.processing}
                    </span>
                  </div>
                </div>
              </div>

              <dl className="divide-y divide-border border border-border bg-paper">
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <dt className="label-tech">{t.pixelsAnalyzed}</dt>
                  <dd className="num-tabular font-mono text-base font-semibold">
                    {pixels.toLocaleString("en-US")}
                  </dd>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <dt className="label-tech">{t.regionDetected}</dt>
                  <dd className="label-tech-ink">{ANALYSIS_TELEMETRY.regionDetected}</dd>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <dt className="label-tech">{t.segmentation}</dt>
                  <dd className="label-tech-ink font-semibold">
                    {isComplete ? t.analysisComplete : stageTextLabel || currentStageObj?.label}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Official Subtle Disclaimer */}
        <div className="mt-6 border border-hairline bg-paper/60 p-3 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground font-mono">
            {t.disclaimer}
          </p>
        </div>

        {/* Development Diagnostic Panel — only visible in dev mode */}
        {import.meta.env.DEV && (
          <div className="mt-4 border border-dashed border-amber-500/60 bg-amber-950/20 p-3 font-mono text-xs text-amber-300 rounded">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-1.5 mb-2 font-bold tracking-wider text-amber-400">
              <span>[DEV DIAGNOSTIC PANEL]</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">DEV MODE</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
              <div><span className="text-amber-500/80">STAGE:</span> <span className="font-semibold">{pipelineStage}</span></div>
              <div><span className="text-amber-500/80">PROGRESS:</span> <span className="font-semibold">{Math.round(progressPercent)}%</span></div>
              <div><span className="text-amber-500/80">ELAPSED:</span> <span className="font-semibold">{(elapsedMs / 1000).toFixed(1)}s</span></div>
              <div><span className="text-amber-500/80">MODEL:</span> <span className="font-semibold">LOCAL CV</span></div>
              <div><span className="text-amber-500/80">INFERENCE:</span> <span className="font-semibold">{isComplete ? "DONE" : isError ? "ERROR" : "RUNNING"}</span></div>
              <div><span className="text-amber-500/80">PIXELS:</span> <span className="font-semibold">{pixels.toLocaleString()}</span></div>
            </div>
            {stageTextLabel && (
              <div className="mt-1.5 border-t border-amber-500/20 pt-1.5 text-amber-400/80">
                LABEL: {stageTextLabel}
              </div>
            )}
          </div>
        )}

        <MetaStrip
          className="mt-6"
          items={[
            { label: "MODEL", value: ANALYSIS_TELEMETRY.model },
            { label: "FRAME RATE", value: ANALYSIS_TELEMETRY.frameRate },
            { label: "MODE", value: "LOCAL INFERENCE PIPELINE" },
            { label: "PROTOCOL", value: "MU-01" },
          ]}
        />
      </main>
    </div>
  );
}
