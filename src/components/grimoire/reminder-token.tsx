import { CircleDot } from "lucide-react";
import type { CSSProperties } from "react";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
import { roleById } from "@/lib/game-data";
import { cn } from "@/lib/utils";

type ReminderTokenProps = {
  label: string;
  roleId: string | null;
  size?: "inline" | "tray" | number;
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
  selected = false,
  count,
  className,
}: ReminderTokenProps) {
  const role = roleId ? roleById.get(roleId) : null;
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
        className,
      )}
      style={style}
      aria-hidden="true"
      data-reminder-label={label}
    >
      {role ? (
        <RoleArtwork role={role} size="tiny" showName={false} />
      ) : (
        <CircleDot className="reminder-token-generic-icon" />
      )}
      {count !== undefined && count > 1 && (
        <span className="reminder-token-count">{count}</span>
      )}
    </span>
  );
}
