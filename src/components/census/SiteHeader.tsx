import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark";
import { StatusDot } from "./StatusDot";
import { SYSTEM_META } from "@/data/census";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/utils/language";

export function SiteHeader({ context, className }: { context?: string; className?: string }) {
  const [lang, setLang] = useLanguage();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-hairline bg-background/92 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="min-w-0" aria-label="MUDI UNDO — home">
          <Wordmark size="sm" showSub={false} />
          <div className="label-tech mt-1 truncate">
            {context ?? `${SYSTEM_META.department} · ${SYSTEM_META.division}`}
          </div>
        </Link>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "ml" : "en")}
            className="inline-flex items-center gap-1.5 rounded-none border border-border bg-paper px-2 py-1 text-xs font-mono transition-colors hover:bg-secondary cursor-pointer select-none"
            aria-label="Toggle language between English and Malayalam"
          >
            <span className={lang === "en" ? "font-bold text-primary" : "text-muted-foreground"}>
              EN
            </span>
            <span className="text-muted-foreground opacity-50">|</span>
            <span className={lang === "ml" ? "font-bold text-primary" : "text-muted-foreground"}>
              മലയാളം
            </span>
          </button>
          <StatusDot className="hidden sm:inline-flex" />
        </div>
      </div>
    </header>
  );
}
