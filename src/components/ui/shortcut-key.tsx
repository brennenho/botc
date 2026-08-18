import type { ReactNode } from "react";

import { formatKeyboardShortcut } from "@/lib/keyboard-shortcuts";
import { cn } from "@/lib/utils";

export function ShortcutKey({
  shortcut,
  className,
  size = "md",
}: {
  shortcut: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <kbd className={cn("shortcut-key", className)} data-size={size}>
      {formatKeyboardShortcut(shortcut)}
    </kbd>
  );
}

export function ShortcutKeys({
  shortcuts,
  className,
  size = "md",
}: {
  shortcuts: readonly string[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span className={cn("shortcut-key-list", className)}>
      {shortcuts.map((shortcut, index) => (
        <span key={`${shortcut}-${index}`}>
          {index > 0 ? (
            <span className="shortcut-key-separator">or</span>
          ) : null}
          <ShortcutKey shortcut={shortcut} size={size} />
        </span>
      ))}
    </span>
  );
}

export function ShortcutHint({
  label,
  shortcuts,
  size = "md",
}: {
  label: ReactNode;
  shortcuts: readonly string[];
  size?: "sm" | "md";
}) {
  return (
    <span className="shortcut-hint">
      <span>{label}</span>
      <ShortcutKeys shortcuts={shortcuts} size={size} />
    </span>
  );
}
