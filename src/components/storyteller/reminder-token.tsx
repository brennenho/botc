import Image from "next/image";
import type { CSSProperties } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { ReminderIcon } from "@/components/storyteller/reminder-icon";
import { roleById } from "@/lib/game-data";
import { cn } from "@/lib/utils";

type ReminderTokenProps = {
  label: string;
  roleId: string | null;
  size?: "inline" | "tray" | number;
  presentation?: "icon" | "labeled" | "artwork";
  selected?: boolean;
  count?: number;
  showSingleCount?: boolean;
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
  showSingleCount = false,
  className,
}: ReminderTokenProps) {
  const role = roleId ? roleById.get(roleId) : null;
  const labelLayout =
    label.length <= 11 ? "single" : label.length >= 19 ? "compact" : "wrapped";
  const style: ReminderTokenStyle | undefined =
    typeof size === "number"
      ? { "--reminder-token-size": `${size}px` }
      : undefined;

  const fallback = <ReminderIcon className="reminder-token-fallback-icon" />;
  const face =
    presentation === "artwork" ? (
      role ? (
        <Image
          src={role.imagePath}
          alt=""
          fill
          sizes={typeof size === "number" ? `${size}px` : "36px"}
          className="object-contain"
        />
      ) : (
        fallback
      )
    ) : (
      <span
        className={cn(
          "reminder-token-face tactile-surface",
          !role && "is-generic",
        )}
      >
        {role && (
          <CharacterToken
            role={role}
            size="fill"
            appearance="soft"
            className="reminder-token-source-art"
          />
        )}
        {!role && fallback}
      </span>
    );

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
      {face}
      {presentation === "labeled" && (
        <span className="reminder-token-label">
          <span className="reminder-token-label-text">{label}</span>
        </span>
      )}
      {count !== undefined && count >= (showSingleCount ? 1 : 2) && (
        <span className="reminder-token-count">{count}</span>
      )}
    </span>
  );
}
