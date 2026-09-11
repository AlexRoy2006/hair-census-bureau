import type { CensusResult } from "@/data/census";

export function TwinCard({ twin }: { twin: CensusResult["twin"] }) {
  return (
    <section className="border border-border bg-paper">
      <div className="hairline-b flex items-center justify-between px-4 py-3">
        <h3 className="label-tech-ink">YOUR CENSUS TWIN</h3>
        <span className="label-tech">MATCH MU-04</span>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 p-4 sm:p-5">
        <div className="relative h-24 w-20 shrink-0 border border-hairline bg-secondary/60">
          <div className="grid-paper absolute inset-0 opacity-50" aria-hidden />
          <svg viewBox="0 0 80 96" className="absolute inset-0 h-full w-full" aria-hidden>
            <path
              d="M40 16 C56 16 66 28 66 44 C66 56 60 62 56 68 C68 74 74 82 76 96 L4 96 C6 82 12 74 24 68 C20 62 14 56 14 44 C14 28 24 16 40 16 Z"
              fill="var(--color-foreground)"
              opacity="0.85"
            />
          </svg>
          <span className="label-tech absolute -top-px -right-px bg-paper px-1">ID</span>
        </div>

        <div className="min-w-0">
          <div className="wordmark truncate text-2xl sm:text-3xl">{twin.name}</div>
          <div className="mt-1.5 inline-block border border-hairline bg-accent/60 px-2 py-1">
            <span className="label-tech-ink">{twin.association}</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{twin.note}</p>
        </div>
      </div>
    </section>
  );
}
