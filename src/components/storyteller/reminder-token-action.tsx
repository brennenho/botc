"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { ReminderToken } from "@/components/storyteller/reminder-token";
import { cn } from "@/lib/utils";

export type ReminderTokenActionProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  actionLabel: string;
  reminderLabel: string;
  roleId: string | null;
  tokenSize?: "inline" | "tray" | number;
  presentation?: "icon" | "labeled";
  selected?: boolean;
  count?: number;
  showSingleCount?: boolean;
  caption?: ReactNode;
};

export const ReminderTokenAction = forwardRef<
  HTMLButtonElement,
  ReminderTokenActionProps
>(function ReminderTokenAction(
  {
    actionLabel,
    reminderLabel,
    roleId,
    tokenSize = "tray",
    presentation = "icon",
    selected,
    count,
    showSingleCount = false,
    caption,
    className,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn("reminder-token-action tactile-action", className)}
      aria-label={actionLabel}
      aria-pressed={selected}
      {...props}
    >
      <ReminderToken
        label={reminderLabel}
        roleId={roleId}
        size={tokenSize}
        presentation={presentation}
        selected={selected}
        count={count}
        showSingleCount={showSingleCount}
      />
      {caption !== undefined && (
        <span className="reminder-token-action-caption" aria-hidden="true">
          {caption}
        </span>
      )}
    </button>
  );
});
