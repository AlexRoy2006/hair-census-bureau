import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  note,
  index = 0,
  className,
}: {
  label: string;
  value: string;
  note?: string;
  index?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-rise relative border border-border bg-paper p-4 sm:p-5",
        className,
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="label-tech">{label}</div>
      <div className="wordmark num-tabular mt-3 text-3xl sm:text-4xl">{value}</div>
      {note && <div className="label-tech mt-2">{note}</div>}
      <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-hairline" aria-hidden />
    </div>
  );
}
