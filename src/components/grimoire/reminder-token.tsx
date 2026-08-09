import { CircleDot } from "lucide-react";
import type { CSSProperties } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { roleById } from "@/lib/game-data";
import { cn } from "@/lib/utils";

type ReminderTokenProps = {
  label: string;
  roleId: string | null;
  size?: "inline" | "tray" | number;
  presentation?: "icon" | "labeled";
  selected?: boolean;
  count?: number;
  className?: string;
};

type ReminderTokenStyle = CSSProperties & {
  "--reminder-token-size"?: string;
};

export function ReminderToken({
  label,
  roleId,
  size = "tray",
  presentation = "icon",
  selected = false,
  count,
  className,
}: ReminderTokenProps) {
  const role = roleId ? roleById.get(roleId) : null;
  const labelLayout =
    label.length <= 11 ? "single" : label.length >= 19 ? "compact" : "wrapped";
  const style: ReminderTokenStyle | undefined =
    typeof size === "number"
      ? { "--reminder-token-size": `${size}px` }
      : undefined;

  return (
    <span
      className={cn(
        "reminder-token",
        typeof size === "string" && `reminder-token-${size}`,
        selected && "is-selected",
        `reminder-token-${presentation}`,
        className,
      )}
      style={style}
      aria-hidden="true"
      data-reminder-label={label}
      data-label-layout={labelLayout}
      data-team={role?.team}
    >
      <span className={cn("reminder-token-face", !role && "is-generic")}>
        {role && (
          <CharacterToken
            role={role}
            size="fill"
            appearance="soft"
            className="reminder-token-source-art"
          />
        )}
        {!role && <CircleDot className="reminder-token-fallback-icon" />}
      </span>
      {presentation === "labeled" && (
        <span className="reminder-token-label">
          <span className="reminder-token-label-text">{label}</span>
        </span>
      )}
      {count !== undefined && count > 1 && (
        <span className="reminder-token-count">{count}</span>
      )}
    </span>
  );
}
