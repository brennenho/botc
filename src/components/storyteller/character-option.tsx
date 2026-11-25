import { Check, LockKeyhole, Minus, Plus } from "lucide-react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { RoleInfoButton } from "@/components/storyteller/role-info-button";
import { Button } from "@/components/ui/button";
import { getSetupRoleCopyLimit, type Role } from "@/lib/game-data";

export type ChangeCopies = (roleId: string, action: "add" | "remove") => void;

export function CharacterOption({
  role,
  count,
  fixedCount,
  assignmentLabel,
  cannotAdd,
  selectionMode,
  inPlay,
  bluff,
  onSelect,
  onChangeCopies,
}: {
  role: Role;
  count: number;
  fixedCount: number;
  assignmentLabel?: string;
  cannotAdd: boolean;
  selectionMode: "single" | "multiple";
  inPlay: boolean;
  bluff: boolean;
  onSelect: (roleId: string) => void;
  onChangeCopies?: ChangeCopies;
}) {
  const copyLimit = getSetupRoleCopyLimit(role.id);
  const selected = count > 0;
  const status = [assignmentLabel, inPlay && "In play", bluff && "Demon bluff"]
    .filter(Boolean)
    .join(" · ");
  return (
    <div
      className="character-option"
      data-selected={selected || undefined}
      data-assigned={fixedCount > 0 || undefined}
    >
      <Button
        type="button"
        variant="quiet"
        className="character-option-button"
        aria-label={`${role.name}${assignmentLabel ? `, ${assignmentLabel}` : ""}${inPlay ? ", in play" : ""}${bluff ? ", demon bluff" : ""}`}
        aria-pressed={selectionMode === "multiple" ? selected : undefined}
        aria-current={selectionMode === "single" && selected ? true : undefined}
        disabled={cannotAdd && !selected}
        onClick={() => onSelect(role.id)}
      >
        <span className="character-option-token">
          <CharacterToken role={role} size="sm" />
          {fixedCount > 0 ? (
            <LockKeyhole aria-hidden="true" />
          ) : (
            selected && <Check aria-hidden="true" />
          )}
        </span>
        <span className="character-option-label">
          {role.name}
          {status && <small>{status}</small>}
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
          <output aria-label={`${role.name} count`}>
            {fixedCount + count}
          </output>
          <Button
            type="button"
            variant="quiet"
            size="icon"
            aria-label={`Add one ${role.name}`}
            disabled={cannotAdd}
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
