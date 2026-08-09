"use client";

import { Plus } from "lucide-react";

import { CharacterToken } from "@/components/grimoire/character-token";
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
    <section className="board-bluff-rack" aria-label="Demon Bluffs">
      <span className="bluff-rack-label">Demon Bluffs</span>
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
                  ? `Change ${role.name} Demon Bluff`
                  : `Set Demon Bluff ${slot + 1}`
              }
              onClick={() => onChooseBluff(slot)}
            >
              {role ? (
                <CharacterToken role={role} size="sm" />
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
