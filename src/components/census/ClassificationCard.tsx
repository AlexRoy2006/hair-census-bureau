import type { CensusResult } from "@/data/census";

export function ClassificationCard({ result }: { result: CensusResult }) {
  return (
    <section className="animate-rise border border-primary/35 bg-accent/40">
      <div className="flex items-center justify-between border-b border-primary/25 px-4 py-3">
        <h3 className="label-tech-ink">CENSUS CLASSIFICATION</h3>
        <span className="label-tech">TIER 06 / 06</span>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none sm:text-4xl" aria-hidden>
            {result.classificationGlyph}
          </span>
          <span className="wordmark text-3xl break-words sm:text-5xl">
            {result.classification}
          </span>
        </div>

        <div className="mt-4 inline-block border border-primary bg-primary px-3 py-1.5">
          <span className="label-tech text-primary-foreground">{result.populationStatus}</span>
        </div>

        <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground/80">
          “{result.classificationNote}”
        </p>

        <p className="label-tech mt-5">
          EXPERIMENTAL ESTIMATE · NOT A MEDICAL OR DIAGNOSTIC MEASUREMENT
        </p>
      </div>
    </section>
  );
}
