import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex h-9 items-center rounded-md bg-[var(--control-hover)] p-0.5",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-8 rounded-[5px] px-3 text-xs font-medium text-[var(--control-text-muted)] transition-colors",
            value === option.value &&
              "bg-[var(--control-secondary-bg-hover)] text-[var(--control-text)] shadow-[0_1px_3px_rgba(30,24,16,0.13)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
