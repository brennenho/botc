"use client";

import { Plus } from "lucide-react";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
import { roleById } from "@/lib/game-data";
import type { GameToken } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export function DemonBluffRack({
  bluffs,
  onChooseBluff,
}: {
  bluffs: GameToken[];
  onChooseBluff: (slot: number) => void;
}) {
  return (
    <section className="board-bluff-rack" aria-label="Demon bluffs">
      <span className="bluff-rack-label">Demon bluffs</span>
      <div className="bluff-slots">
        {[0, 1, 2].map((slot) => {
          const token = bluffs.find((bluff) => bluff.position === slot);
          const role = token?.roleId ? roleById.get(token.roleId) : null;
          return (
            <button
              key={slot}
              type="button"
              className={cn("bluff-slot", role && "has-role")}
              aria-label={
                role
                  ? `Change ${role.name} demon bluff`
                  : `Set demon bluff ${slot + 1}`
              }
              onClick={() => onChooseBluff(slot)}
            >
              {role ? (
                <RoleArtwork role={role} size="tiny" />
              ) : (
                <Plus className="size-4" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
