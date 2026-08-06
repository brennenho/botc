import type { ReactNode } from "react";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
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
  const classes = cn(
    "token-icon",
    `token-icon-${size}`,
    `token-icon-${appearance}`,
    !role && "token-icon-generic",
    className,
  );

  if (role) {
    return (
      <RoleArtwork
        role={role}
        size="tiny"
        showName={false}
        className={classes}
      />
    );
  }

  return (
    <span className={classes} aria-hidden="true">
      {children}
    </span>
  );
}
