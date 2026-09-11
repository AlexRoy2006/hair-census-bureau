import type { CensusResult } from "@/data/census";

export function CensusCertificate({ result }: { result: CensusResult }) {
  const rows: Array<[string, string]> = [
    ["CENSUS NUMBER", result.censusNumber],
    ["HAIR POPULATION", result.hairPopulation.toLocaleString("en-US")],
    ["HAIR COVERAGE", `${result.hairCoverage}%`],
    ["CLASSIFICATION", result.classification],
    ["CENSUS STATUS", "VERIFIED"],
  ];

  return (
    <article className="relative overflow-hidden border-2 border-primary bg-paper">
      <div className="grid-paper absolute inset-0 opacity-25" aria-hidden />
      <div className="relative m-1.5 border border-hairline px-5 py-6 sm:px-8 sm:py-8">
        <div className="text-center">
          <div className="wordmark text-2xl sm:text-3xl">
            MUDI UNDO?<sup className="align-super text-[0.35em]">™</sup>
          </div>
          <div className="label-tech mt-2">OFFICIAL HUMAN HAIR CENSUS</div>
          <div className="mx-auto mt-4 h-px w-16 bg-primary" />
        </div>

        <dl className="mt-6 divide-y divide-border border-y border-border">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-3"
            >
              <dt className="label-tech min-w-0">{label}</dt>
              <dd className="num-tabular font-mono text-sm font-semibold tracking-tight break-words text-ink">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-primary text-center">
            <span className="label-tech text-primary">
              SEAL
              <br />
              MU
            </span>
          </div>
          <div className="min-w-0 text-right">
            <div className="label-tech">ISSUED</div>
            <div className="num-tabular font-mono text-xs">{result.issuedAt}</div>
            <div className="label-tech mt-2">SIGNED</div>
            <div className="font-mono text-xs italic">Chief Follicle Registrar</div>
          </div>
        </div>

        <div className="hairline-t mt-6 pt-4 text-center">
          <div className="label-tech-ink">DEPARTMENT OF HAIR AFFAIRS</div>
          <div className="label-tech mt-1.5">GOVERNMENT OF ABSOLUTELY NECESSARY THINGS</div>
        </div>
      </div>
    </article>
  );
}
