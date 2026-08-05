import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-[var(--control-border)] bg-[var(--control-secondary-bg)] px-3 text-sm text-[var(--control-text)] outline-none placeholder:text-[var(--control-placeholder)] focus:border-[var(--focus-ring)] focus:bg-[var(--control-secondary-bg-hover)] focus:ring-2 focus:ring-[var(--focus-ring)]",
        className,
      )}
      {...props}
    />
  );
}
