import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full text-[var(--control-text)] outline-none transition-[color,background-color,border-color,box-shadow] duration-150 placeholder:text-[var(--control-placeholder)]",
  {
    variants: {
      variant: {
        default:
          "h-10 rounded-md border border-[var(--control-border)] bg-[var(--control-secondary-bg)] px-3 text-sm focus:border-[var(--focus-ring)] focus:bg-[var(--control-secondary-bg-hover)] focus:ring-2 focus:ring-[var(--focus-ring)]",
        inline:
          "h-6 rounded-none border-0 border-b border-b-transparent bg-transparent px-1 py-0 text-[13px] font-semibold leading-tight focus:border-b-[var(--grimoire-hardware-accent,var(--brass-dark))] focus:bg-[rgb(248_238_210_/_62%)] focus:ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type InputProps = React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants>;

export function Input({ className, variant, ...props }: InputProps) {
  return (
    <input className={cn(inputVariants({ variant }), className)} {...props} />
  );
}

export { inputVariants };
