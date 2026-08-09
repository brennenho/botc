import { RoleArtwork } from "@/components/grimoire/role-artwork";
import type { Role } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export type CharacterTokenSize = "sm" | "md" | "lg" | "fill";
export type CharacterTokenAppearance = "soft" | "parchment" | "bare";

export function CharacterToken({
  role,
  size = "sm",
  appearance = "soft",
  showName = false,
  presentation = "icon",
  priority = false,
  imageSizes,
  className,
}: {
  role: Role;
  size?: CharacterTokenSize;
  appearance?: CharacterTokenAppearance;
  showName?: boolean;
  presentation?: "icon" | "token";
  priority?: boolean;
  imageSizes?: string;
  className?: string;
}) {
  return (
    <RoleArtwork
      role={role}
      size={size === "fill" ? "full" : size === "lg" ? "compact" : "tiny"}
      showName={showName}
      presentation={presentation}
      priority={priority}
      imageSizes={imageSizes ?? (size === "fill" ? "220px" : "48px")}
      className={cn(
        "character-token",
        `character-token-${size}`,
        `character-token-${appearance}`,
        className,
      )}
    />
  );
}
