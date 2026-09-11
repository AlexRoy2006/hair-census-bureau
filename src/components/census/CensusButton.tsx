import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex w-full items-center justify-center gap-2 border font-mono text-[0.72rem] font-medium tracking-[0.18em] uppercase transition-all duration-150 select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 active:translate-y-px sm:w-auto",
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[3px_3px_0_0_var(--color-hairline)]",
        outline:
          "border-hairline bg-paper text-foreground hover:border-primary hover:bg-accent/50",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:text-foreground",
        danger:
          "border-destructive/40 bg-paper text-destructive hover:bg-destructive hover:text-destructive-foreground",
      },
      size: {
        lg: "min-h-14 px-7 py-4",
        md: "min-h-12 px-5 py-3",
        sm: "min-h-10 px-3.5 py-2 text-[0.65rem]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface CensusButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function CensusButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: CensusButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
