import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { SiteHeader } from "@/components/census/SiteHeader";
import { SiteFooter } from "@/components/census/SiteFooter";
import { StatCard } from "@/components/census/StatCard";
import { ClassificationCard } from "@/components/census/ClassificationCard";
import { PopulationScale } from "@/components/census/PopulationScale";
import { TwinCard } from "@/components/census/TwinCard";
import { CensusButton } from "@/components/census/CensusButton";
import { CensusModal } from "@/components/census/CensusModal";
import { CensusCertificate } from "@/components/census/CensusCertificate";
import { DisputeModal } from "@/components/census/DisputeModal";
import { MetaStrip } from "@/components/census/MetaStrip";
import { useCountUp } from "@/components/census/useCountUp";
import { getLatestResult, clearCapturedImage } from "@/services/hairAnalysis";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Census Complete — MUDI UNDO?" },
      {
        name: "description",
        content:
          "Official hair census report: estimated hair population, coverage, scalp exposure, baldness index and woodland classification.",
      },
      { property: "og:title", content: "Census Complete — MUDI UNDO?" },
      {
        property: "og:description",
        content: "Your official hair population report, classification and census certificate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const result = getLatestResult();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const population = useCountUp(result?.hairPopulation ?? 0, 1700, 300);

  if (!result) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <SiteHeader context="NO CENSUS ON RECORD" />
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
          <h1 className="wordmark text-3xl sm:text-5xl">NO CENSUS ON RECORD</h1>
          <p className="max-w-prose text-sm leading-relaxed text-foreground/80">
            The department has no completed hair census for this session. Please submit an image
            for analysis.
          </p>
          <CensusButton asChild size="lg">
            <Link to="/camera">
              BEGIN CENSUS <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CensusButton>
        </main>
        <SiteFooter />
      </div>
    );
  }


  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader context={`REPORT ${result.censusNumber}`} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="animate-rise hairline-b flex items-center justify-between pb-3">
          <span className="label-tech-ink">CENSUS COMPLETE</span>
          <span className="label-tech num-tabular">{result.issuedAt}</span>
        </div>

        {/* headline result */}
        <section className="animate-rise mt-6">
          <h1 className="wordmark text-4xl sm:text-6xl">MUDI UNDO?</h1>
          <div lang="ml" className="mt-2 text-base text-muted-foreground">
            മുടി ഉണ്ടോ?
          </div>

          <div className="mt-6 border border-hairline bg-paper p-5 sm:p-7">
            <div className="label-tech">HAIR POPULATION</div>
            <div className="wordmark num-tabular mt-3 text-5xl leading-none sm:text-7xl">
              {population.toLocaleString("en-US")}
            </div>
            <div className="label-tech mt-3">
              ESTIMATED ± {result.populationMargin.toLocaleString("en-US")}
            </div>
          </div>
        </section>

        {/* statistics */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="HAIR COVERAGE" value={`${result.hairCoverage}%`} index={0} />
          <StatCard label="SCALP EXPOSURE" value={`${result.scalpExposure}%`} index={1} />
          <StatCard label="BALDNESS INDEX" value={`${result.baldnessIndex}`} index={2} />
          <StatCard label="CONFIDENCE" value={`${result.confidence}%`} index={3} />
        </section>

        <p className="label-tech mt-3">
          ALL METRICS ARE EXPERIMENTAL ESTIMATES PRODUCED BY AN UNVERIFIED VISION PIPELINE.
        </p>

        <div className="mt-6">
          <ClassificationCard result={result} />
        </div>

        <div className="mt-6">
          <TwinCard twin={result.twin} />
        </div>

        <div className="mt-6">
          <PopulationScale active={result.classification} />
        </div>

        {/* verdict */}
        <section className="mt-6 border border-border bg-paper">
          <div className="hairline-b flex items-center justify-between px-4 py-3">
            <h3 className="label-tech-ink">FINAL VERDICT</h3>
            <span className="label-tech">DOC MU-07</span>
          </div>
          <div className="p-5 sm:p-7">
            <p className="wordmark text-xl sm:text-2xl">HAIR DETECTED.</p>
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground/80">
              The census department confirms that the subject currently possesses a statistically
              significant quantity of hair.
            </p>
            <div className="hairline-t mt-6 grid gap-2 pt-4 sm:grid-cols-2">
              <span className="label-tech">CERTIFIED BY: CENSUS DIVISION</span>
              <span className="label-tech sm:text-right">REF {result.censusNumber}</span>
            </div>
          </div>
        </section>

        {/* actions */}
        <section className="mt-6 flex flex-col gap-3">
          <CensusButton asChild size="lg" className="w-full">
            <Link to="/camera" onClick={() => clearCapturedImage()}>
              TAKE ANOTHER CENSUS <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CensusButton>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CensusButton
              variant="outline"
              size="lg"
              className="w-full sm:flex-1"
              onClick={() => setCertOpen(true)}
            >
              <FileText className="h-3.5 w-3.5" /> GENERATE CENSUS CERTIFICATE
            </CensusButton>
            <CensusButton
              variant="danger"
              size="lg"
              className="w-full sm:flex-1"
              onClick={() => setDisputeOpen(true)}
            >
              DISPUTE THIS CENSUS
            </CensusButton>
          </div>
        </section>

        <MetaStrip
          className="mt-8"
          items={[
            { label: "CENSUS NUMBER", value: result.censusNumber },
            { label: "ANALYSIS REGION", value: result.telemetry.analysisRegion },
            { label: "PIXELS ANALYZED", value: result.telemetry.pixelsAnalysed.toLocaleString("en-US") },
            { label: "DATA SOURCE", value: "CAMERA / ACQUIRED" },
          ]}
        />
      </main>

      <SiteFooter />

      <DisputeModal
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        censusNumber={result.censusNumber}
      />

      <CensusModal
        open={certOpen}
        onOpenChange={setCertOpen}
        title="CENSUS CERTIFICATE"
        meta={`DOC MU-11 · ${result.censusNumber}`}
      >
        <CensusCertificate result={result} />
        <p className="label-tech mt-4">SCREENSHOT THIS DOCUMENT TO RETAIN YOUR RECORD.</p>
      </CensusModal>
    </div>
  );
}
