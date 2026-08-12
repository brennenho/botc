import { EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyCharacterState({
  variant,
}: {
  variant: "assignable" | "unassigned";
}) {
  return (
    <span
      className={cn("empty-character-state", `is-${variant}`)}
      aria-hidden="true"
    >
      {variant === "assignable" ? (
        <span className="empty-character-plus">+</span>
      ) : (
        <EyeOff />
      )}
      <span>{variant === "assignable" ? "Character" : "Not Assigned"}</span>
    </span>
  );
}
