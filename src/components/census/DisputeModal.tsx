import { useState } from "react";
import { CensusModal } from "./CensusModal";
import { CensusButton } from "./CensusButton";
import { DISPUTE_REASONS, DISPUTE_RESPONSE } from "@/data/census";
import { cn } from "@/lib/utils";

export function DisputeModal({
  open,
  onOpenChange,
  censusNumber,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  censusNumber: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (reason: string) =>
    setSelected((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    );

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => {
        setSubmitted(false);
        setSelected([]);
      }, 200);
    }
  };

  return (
    <CensusModal
      open={open}
      onOpenChange={handleOpenChange}
      title="CENSUS DISPUTE FORM"
      meta={`FORM MU-09 · REF ${censusNumber}`}
    >
      {submitted ? (
        <div className="animate-rise">
          <div className="border border-primary/30 bg-accent/50 px-4 py-3">
            <div className="label-tech-ink">DISPUTE RECEIVED</div>
          </div>
          <ul className="mt-4 space-y-3">
            {DISPUTE_RESPONSE.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed">
                <span className="label-tech mt-1">▸</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="hairline-t mt-5 pt-4">
            <CensusButton variant="outline" size="md" onClick={() => handleOpenChange(false)}>
              CLOSE FORM
            </CensusButton>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <p className="text-sm leading-relaxed">Why are you disputing this census?</p>
          <div className="mt-4 divide-y divide-border border border-border">
            {DISPUTE_REASONS.map((reason) => {
              const checked = selected.includes(reason);
              return (
                <label
                  key={reason}
                  className={cn(
                    "flex min-h-13 cursor-pointer items-center gap-3 px-3.5 py-3 transition-colors",
                    checked ? "bg-accent/50" : "hover:bg-secondary/60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggle(reason)}
                  />
                  <span
                    className={cn(
                      "grid h-4.5 w-4.5 shrink-0 place-items-center border",
                      checked ? "border-primary bg-primary" : "border-hairline bg-paper",
                    )}
                    aria-hidden
                  >
                    {checked && <span className="h-1.5 w-1.5 bg-primary-foreground" />}
                  </span>
                  <span className="min-w-0 text-sm">{reason}</span>
                </label>
              );
            })}
          </div>
          <div className="hairline-t mt-5 pt-4">
            <CensusButton type="submit" size="lg" disabled={selected.length === 0}>
              SUBMIT DISPUTE
            </CensusButton>
            <p className="label-tech mt-3">
              ALL DISPUTES ARE FICTIONAL AND ARE NOT STORED ANYWHERE.
            </p>
          </div>
        </form>
      )}
    </CensusModal>
  );
}
