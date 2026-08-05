import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--control-primary-bg)] text-[var(--control-primary-text)] shadow-sm hover:bg-[var(--control-primary-bg-hover)] active:bg-[var(--control-primary-bg-hover)]",
        secondary:
          "border-[var(--control-border)] bg-[var(--control-secondary-bg)] text-[var(--control-text)] hover:bg-[var(--control-secondary-bg-hover)] active:bg-[var(--control-secondary-bg-hover)]",
        quiet:
          "text-[var(--control-text-muted)] hover:bg-[var(--control-hover)] hover:text-[var(--control-text)] active:bg-[var(--control-hover)]",
        danger:
          "text-[var(--status-danger)] hover:bg-[var(--status-danger-hover)] active:bg-[var(--status-danger-hover)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

export { buttonVariants };
