import type { ReactNode } from "react";

import { CharacterToken } from "@/components/grimoire/character-token";
import type { Role } from "@/lib/game-data";
import { cn } from "@/lib/utils";

type TokenIconProps = {
  role?: Role | null;
  children?: ReactNode;
  size?: "sm" | "md";
  appearance?: "soft" | "parchment";
  className?: string;
};

export function TokenIcon({
  role,
  children,
  size = "sm",
  appearance = "soft",
  className,
}: TokenIconProps) {
  if (role) {
    return (
      <CharacterToken
        role={role}
        size={size}
        appearance={appearance}
        className={className}
      />
    );
  }

  return (
    <span
      className={cn(
        "token-icon token-icon-generic",
        `token-icon-${size}`,
        `token-icon-${appearance}`,
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
