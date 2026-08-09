"use client";

import { Plus, X } from "lucide-react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { IconButton } from "@/components/ui/icon-button";
import { roleById } from "@/lib/game-data";
import type { GameToken } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export function DemonBluffRack({
  bluffs,
  onChooseBluff,
  onClearBluff,
}: {
  bluffs: GameToken[];
  onChooseBluff: (slot: number) => void;
  onClearBluff: (slot: number) => void;
}) {
  return (
    <section className="board-bluff-rack" aria-label="Demon Bluffs">
      <span className="bluff-rack-label">Demon Bluffs</span>
      <div className="bluff-slots">
        {[0, 1, 2].map((slot) => {
          const token = bluffs.find((bluff) => bluff.position === slot);
          const role = token?.roleId ? roleById.get(token.roleId) : null;
          return (
            <div key={slot} className="bluff-slot-control">
              <button
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
              {role ? (
                <IconButton
                  label={`Clear ${role.name} Demon Bluff`}
                  size="sm"
                  variant="quiet"
                  tooltipSide="top"
                  className="bluff-slot-clear size-4"
                  onClick={() => onClearBluff(slot)}
                >
                  <X className="size-2.5" />
                </IconButton>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
