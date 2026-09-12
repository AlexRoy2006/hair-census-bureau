import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark";
import { StatusDot } from "./StatusDot";
import { SYSTEM_META } from "@/data/census";
import { cn } from "@/lib/utils";

export function SiteHeader({ context, className }: { context?: string; className?: string }) {
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
        <StatusDot className="hidden sm:inline-flex" />
        <StatusDot label="ONLINE" className="sm:hidden" />
      </div>
    </header>
  );
}
