import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "ui-button inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-transparent font-medium outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--control-primary-bg)] text-[var(--control-primary-text)] shadow-[var(--shadow-control-rest)] hover:-translate-y-px hover:bg-[var(--control-primary-bg-hover)] hover:shadow-[var(--shadow-control-hover)] active:translate-y-0 active:bg-[var(--control-primary-bg-hover)] active:shadow-[var(--shadow-control-pressed)]",
        secondary:
          "border-[var(--control-border)] bg-[var(--control-secondary-bg)] text-[var(--control-text)] shadow-[var(--shadow-control-rest)] hover:-translate-y-px hover:bg-[var(--control-secondary-bg-hover)] hover:shadow-[var(--shadow-control-hover)] active:translate-y-0 active:bg-[var(--control-secondary-bg-hover)] active:shadow-[var(--shadow-control-pressed)]",
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
      focusStyle: {
        control: "focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        surface: "focus-visible:ring-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      focusStyle: "control",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    pending?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      focusStyle,
      pending = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, focusStyle }), className)}
        data-size={size ?? "md"}
        data-pending={pending || undefined}
        aria-busy={pending || undefined}
        disabled={pending ? true : disabled}
        {...props}
      >
        {pending ? <Spinner /> : null}
        {children}
      </button>
    );
  },
);

export { buttonVariants };
