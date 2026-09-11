import { cn } from "@/lib/utils";

export function Wordmark({
  size = "md",
  showSub = true,
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  showSub?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: "text-base",
    md: "text-2xl",
    lg: "text-4xl sm:text-5xl",
    xl: "text-[15vw] leading-[0.85] sm:text-7xl md:text-8xl",
  } as const;

  return (
    <div className={cn("min-w-0", className)}>
      <div className={cn("wordmark", sizes[size])}>
        MUDI UNDO?
        <sup className="ml-0.5 align-super text-[0.35em] font-bold tracking-normal">™</sup>
      </div>
      {showSub && (
        <div className="label-tech mt-1.5">OFFICIAL HUMAN HAIR POPULATION SURVEY</div>
      )}
    </div>
  );
}
