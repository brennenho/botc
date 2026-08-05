"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Dice5, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CharacterCatalog } from "@/components/grimoire/character-catalog";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { setupCounts, type EditionId, type TeamCounts } from "@/lib/game-data";

const emptyDefaultCounts: TeamCounts = {
  townsfolk: 0,
  outsider: 0,
  minion: 0,
  demon: 0,
};

export function RandomDistributionDialog({
  open,
  editionId,
  playerCount,
  onOpenChange,
  onDistribute,
}: {
  open: boolean;
  editionId: EditionId;
  playerCount: number;
  onOpenChange: (open: boolean) => void;
  onDistribute: (roleIds: string[]) => void;
}) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelectedRoleIds([]);
  }, [open]);
  const defaultTeamCounts = setupCounts[playerCount] ?? emptyDefaultCounts;
  const selectionComplete = selectedRoleIds.length === playerCount;

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) => {
      if (current.includes(roleId)) {
        return current.filter((id) => id !== roleId);
      }
      if (current.length >= playerCount) return current;
      return [...current, roleId];
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Viewport className="dialog-viewport">
          <Dialog.Popup className="token-case pool-case">
            <header className="token-case-header">
              <Dialog.Title>Random distribution</Dialog.Title>
              <IconButton
                label="Close random distribution"
                variant="quiet"
                size="sm"
                tooltip={false}
                className="token-case-close"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
              </IconButton>
            </header>

            <div className="token-case-scroll">
              <CharacterCatalog
                editionId={editionId}
                query=""
                selectedRoleIds={selectedRoleIds}
                selectionMode="multiple"
                selectionLimit={playerCount}
                defaultTeamCounts={defaultTeamCounts}
                onSelect={toggleRole}
              />
            </div>

            <footer className="pool-case-footer">
              <div className="pool-summary">
                <div className="pool-summary-line">
                  <strong>
                    {selectedRoleIds.length} of {playerCount} selected
                  </strong>
                  {selectedRoleIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedRoleIds([])}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <Button
                disabled={!selectionComplete}
                onClick={() => {
                  onDistribute(selectedRoleIds);
                  onOpenChange(false);
                }}
              >
                <Dice5 className="size-4" />
                Distribute roles
              </Button>
            </footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
