import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CensusModal({
  open,
  onOpenChange,
  title,
  meta,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  meta?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] w-full overflow-y-auto border-t border-hairline bg-paper shadow-2xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border",
            className,
          )}
        >
          <div className="hairline-b sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-paper px-4 py-3">
            <div className="min-w-0">
              <Dialog.Title className="wordmark truncate text-sm">{title}</Dialog.Title>
              {meta && <div className="label-tech mt-1 truncate">{meta}</div>}
            </div>
            <Dialog.Close
              className="grid h-10 w-10 shrink-0 place-items-center border border-hairline text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="p-4 sm:p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
