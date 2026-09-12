import { useState } from "react";
import type { CensusResult } from "@/data/census";

interface TwinCardProps {
  twin: CensusResult["twin"];
  hairCoverage?: number;
  scalpExposure?: number;
}

export function TwinCard({ twin, hairCoverage, scalpExposure }: TwinCardProps) {
  const [imgError, setImgError] = useState(false);
  const matchPercent = twin.matchScore ? `${Number(twin.matchScore).toFixed(1)}%` : "87.0%";

  // Calculate filled blocks for HAIR DENSITY COMPATIBILITY meter
  const matchValue = twin.matchScore ?? 87;
  const totalBlocks = 20;
  const filledBlocks = Math.min(
    totalBlocks,
    Math.max(1, Math.round((matchValue / 100) * totalBlocks))
  );
  const blockMeterStr = "█".repeat(filledBlocks) + "░".repeat(totalBlocks - filledBlocks);

  const coverageVal = hairCoverage ?? 78.4;
  const exposureVal = scalpExposure ?? Number((100 - coverageVal).toFixed(1));

  return (
    <section className="border border-border bg-paper p-0">
      {/* Header bar */}
      <div className="hairline-b flex items-center justify-between px-4 py-3 sm:px-6">
        <h3 className="label-tech-ink">YOUR CENSUS TWIN</h3>
        <span className="label-tech num-tabular">MATCH: {matchPercent}</span>
      </div>

      <div className="flex flex-col items-center p-5 text-center sm:p-7">
        {/* Prominent Large Character Image Container */}
        <div className="relative mx-auto my-2 flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden border-2 border-hairline bg-secondary/40 shadow-inner sm:h-56 sm:w-56">
          <div className="grid-paper absolute inset-0 opacity-40" aria-hidden />

          {!imgError && twin.image ? (
            <img
              src={twin.image}
              alt={twin.name}
              className="relative z-10 h-full w-full object-cover transition-opacity duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center gap-1 p-4">
              <span className="label-tech text-xs tracking-widest text-muted-foreground">
                [ CHARACTER ]
              </span>
              <span className="wordmark text-lg text-foreground">{twin.name}</span>
            </div>
          )}

          <span className="label-tech absolute top-1.5 right-1.5 z-20 border border-border bg-paper/90 px-1.5 py-0.5 text-[10px] backdrop-blur-sm">
            TWIN ID #{twin.id ? twin.id.toUpperCase() : "MU-TWIN"}
          </span>
        </div>

        {/* Character Title & Franchise */}
        <h2 className="wordmark mt-4 text-3xl text-foreground sm:text-4xl">{twin.name}</h2>
        {twin.franchise && (
          <div className="label-tech mt-1 text-xs tracking-wider text-muted-foreground uppercase">
            {twin.franchise}
          </div>
        )}

        <div className="mt-2.5 inline-block border border-hairline bg-accent/60 px-3 py-1">
          <span className="label-tech-ink text-xs">{twin.association}</span>
        </div>

        {/* Match Percentage & Progress Bar */}
        <div className="mt-5 w-full max-w-md border border-hairline bg-secondary/30 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="label-tech">CENSUS TWIN MATCH</span>
            <span className="wordmark num-tabular text-lg text-foreground">{matchPercent}</span>
          </div>

          <div className="mt-2 flex flex-col gap-1 text-left">
            <div className="label-tech text-[10px] text-muted-foreground">
              HAIR DENSITY COMPATIBILITY
            </div>
            <div
              className="wordmark num-tabular tracking-widest text-foreground/90 text-sm select-none overflow-x-auto whitespace-nowrap"
              aria-label={`Compatibility meter: ${matchPercent}`}
            >
              {blockMeterStr}
            </div>
          </div>
        </div>

        {/* Funny Description Quote */}
        <blockquote className="mt-4 max-w-prose text-sm italic leading-relaxed text-foreground/80 sm:text-base">
          "{twin.note}"
        </blockquote>

        {/* Actual Census Metrics Strip */}
        <div className="hairline-t mt-6 grid w-full grid-cols-2 gap-3 pt-4 sm:max-w-md">
          <div className="border border-hairline bg-paper px-3 py-2 text-left">
            <span className="label-tech block text-[10px] text-muted-foreground">HAIR COVERAGE</span>
            <span className="wordmark num-tabular text-lg">{coverageVal.toFixed(1)}%</span>
          </div>
          <div className="border border-hairline bg-paper px-3 py-2 text-left">
            <span className="label-tech block text-[10px] text-muted-foreground">SCALP EXPOSURE</span>
            <span className="wordmark num-tabular text-lg">{exposureVal.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
