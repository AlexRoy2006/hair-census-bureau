import { cn } from "@/lib/utils";
import { SYSTEM_META } from "@/data/census";

export type MetaItem = { label: string; value: string };

export const DEFAULT_META: MetaItem[] = [
  { label: "CENSUS PROTOCOL", value: SYSTEM_META.protocol },
  { label: "SYSTEM STATUS", value: SYSTEM_META.status },
  { label: "DATA CLASS", value: SYSTEM_META.dataClass },
  { label: "VERSION", value: SYSTEM_META.version },
];

export function MetaStrip({
  items = DEFAULT_META,
  className,
  columns = 2,
}: {
  items?: MetaItem[];
  className?: string;
  columns?: 2 | 3;
}) {
  return (
    <dl
      className={cn(
        "grid divide-x divide-y divide-border border-t border-l border-border",
        columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 border-r border-b border-border px-3 py-2.5">
          <dt className="label-tech truncate">{item.label}</dt>
          <dd className="label-tech-ink num-tabular mt-1.5 truncate">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
