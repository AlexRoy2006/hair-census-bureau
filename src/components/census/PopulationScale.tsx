import { CLASSIFICATION_SCALE, type Classification } from "@/data/census";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/utils/language";
import { CENSUS_MESSAGES } from "@/config/censusMessages";

export function PopulationScale({ active }: { active: Classification }) {
  const [lang] = useLanguage();
  const t = CENSUS_MESSAGES[lang];
  const activeIndex = CLASSIFICATION_SCALE.indexOf(active);

  return (
    <section className="border border-border bg-paper">
      <div className="hairline-b flex items-center justify-between px-4 py-3">
        <h3 className="label-tech-ink">{t.hairPopulationStatusLabel}</h3>
        <span className="label-tech">SCALE MU-06</span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex h-2 w-full overflow-hidden border border-hairline">
          {CLASSIFICATION_SCALE.map((step, i) => (
            <div
              key={step}
              className={cn(
                "h-full flex-1 border-r border-hairline last:border-r-0",
                i <= activeIndex ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>

        <ol className="mt-3 grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">
          {CLASSIFICATION_SCALE.map((step, i) => {
            const isActive = step === active;
            const translatedLabel = t.classifications[step]?.label || step;
            return (
              <li
                key={step}
                className={cn(
                  "min-w-0 bg-paper px-2.5 py-2.5",
                  isActive && "bg-primary text-primary-foreground",
                )}
              >
                <div className={cn("label-tech", isActive && "text-primary-foreground/70")}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div
                  className={cn(
                    "mt-1 font-mono text-[0.68rem] tracking-[0.1em] break-words uppercase",
                    isActive ? "font-semibold text-primary-foreground" : "text-foreground",
                    lang === "ml" && "font-sans text-xs tracking-normal font-medium",
                  )}
                >
                  {translatedLabel}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
