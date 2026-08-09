import Image from "next/image";

import type { Role } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export function RoleArtwork({
  role,
  size = "full",
  showName = size !== "tiny",
  presentation = "icon",
  priority = false,
  imageSizes = "120px",
  className,
}: {
  role: Role;
  size?: "full" | "compact" | "tiny";
  showName?: boolean;
  presentation?: "icon" | "token";
  priority?: boolean;
  imageSizes?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "role-artwork",
        `role-artwork-${size}`,
        `role-artwork-${presentation}`,
        `team-${role.team}`,
        className,
      )}
    >
      <span className="role-art-crop">
        <Image
          src={role.imagePath}
          alt=""
          fill
          sizes={imageSizes}
          priority={priority}
          draggable={false}
        />
      </span>
      {showName && <span className="role-token-name">{role.name}</span>}
    </span>
  );
}
