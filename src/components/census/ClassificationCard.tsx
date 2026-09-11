import type { CensusResult } from "@/data/census";
import { useLanguage } from "@/utils/language";
import { CENSUS_MESSAGES } from "@/config/censusMessages";

export function ClassificationCard({ result }: { result: CensusResult }) {
  const [lang] = useLanguage();
  const t = CENSUS_MESSAGES[lang];

  const classData = t.classifications[result.classification] || {
    label: result.classification,
    status: result.populationStatus,
  };

  return (
    <section className="animate-rise border border-primary/35 bg-accent/40">
      <div className="flex items-center justify-between border-b border-primary/25 px-4 py-3">
        <h3 className="label-tech-ink">{t.censusClassification}</h3>
        <span className="label-tech">TIER 06 / 06</span>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none sm:text-4xl" aria-hidden>
            {result.classificationGlyph}
          </span>
          <span className="wordmark text-3xl break-words sm:text-5xl">
            {classData.label}
          </span>
        </div>

        <div className="mt-4 inline-block border border-primary bg-primary px-3 py-1.5">
          <span className="label-tech text-primary-foreground font-semibold">{classData.status}</span>
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
