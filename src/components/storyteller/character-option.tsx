import { Check, Minus, Plus } from "lucide-react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { RoleInfoButton } from "@/components/storyteller/role-info-button";
import { Button } from "@/components/ui/button";
import { getSetupRoleCopyLimit, type Role } from "@/lib/game-data";

export type ChangeCopies = (roleId: string, action: "add" | "remove") => void;

export function CharacterOption({
  role,
  count,
  cannotAdd,
  selectionMode,
  inPlay,
  bluff,
  onSelect,
  onChangeCopies,
}: {
  role: Role;
  count: number;
  cannotAdd: boolean;
  selectionMode: "single" | "multiple";
  inPlay: boolean;
  bluff: boolean;
  onSelect: (roleId: string) => void;
  onChangeCopies?: ChangeCopies;
}) {
  const copyLimit = getSetupRoleCopyLimit(role.id);
  const selected = count > 0;
  return (
    <div className="character-option" data-selected={selected || undefined}>
      <Button
        type="button"
        variant="quiet"
        className="character-option-button"
        aria-label={`${role.name}${inPlay ? ", in play" : ""}${bluff ? ", demon bluff" : ""}`}
        aria-pressed={selectionMode === "multiple" ? selected : undefined}
        aria-current={selectionMode === "single" && selected ? true : undefined}
        disabled={cannotAdd && !selected}
        onClick={() => onSelect(role.id)}
      >
        <span className="character-option-token">
          <CharacterToken role={role} size="sm" />
          {selected && <Check aria-hidden="true" />}
        </span>
        <span className="character-option-label">
          {role.name}
          {(inPlay || bluff) && (
            <small>
              {[inPlay && "In play", bluff && "Demon bluff"]
                .filter(Boolean)
                .join(" · ")}
            </small>
          )}
        </span>
      </Button>
      {copyLimit > 1 && onChangeCopies && (
        <div
          className="role-copy-stepper"
          role="group"
          aria-label={`${role.name} copies`}
        >
          <Button
            type="button"
            variant="quiet"
            size="icon"
            aria-label={`Remove one ${role.name}`}
            disabled={!selected}
            onClick={() => onChangeCopies(role.id, "remove")}
          >
            <Minus aria-hidden="true" />
          </Button>
          <output aria-label={`${role.name} count`}>{count}</output>
          <Button
            type="button"
            variant="quiet"
            size="icon"
            aria-label={`Add one ${role.name}`}
            disabled={cannotAdd || count >= copyLimit}
            onClick={() => onChangeCopies(role.id, "add")}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      )}
      <RoleInfoButton role={role} sideOffset={18} />
    </div>
  );
}
