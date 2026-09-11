import { cn } from "@/lib/utils";

export function StatusDot({
  label = "CENSUS SYSTEM ONLINE",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 border border-hairline bg-accent/50 px-2 py-1",
        className,
      )}
    >
      <span className="animate-blip h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      <span className="label-tech-ink">{label}</span>
    </span>
  );
}
