import { formatKeyboardShortcut } from "@/lib/keyboard-shortcuts";
import { cn } from "@/lib/utils";

export function ShortcutKey({
  shortcut,
  className,
}: {
  shortcut: string;
  className?: string;
}) {
  return (
    <kbd className={cn("shortcut-key", className)}>
      {formatKeyboardShortcut(shortcut)}
    </kbd>
  );
}

export function ShortcutTooltip({
  label,
  shortcut,
}: {
  label: React.ReactNode;
  shortcut: string;
}) {
  return (
    <span className="shortcut-tooltip">
      <span>{label}</span>
      <ShortcutKey shortcut={shortcut} />
    </span>
  );
}
