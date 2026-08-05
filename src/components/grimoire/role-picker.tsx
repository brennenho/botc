"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CircleSlash2, Search, X } from "lucide-react";
import { useState } from "react";

import { CharacterCatalog } from "@/components/grimoire/character-catalog";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import type { EditionId } from "@/lib/game-data";

export function RolePicker({
  open,
  editionId,
  title = "Choose a character",
  selectedRoleId,
  usedRoleIds,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  editionId: EditionId;
  title?: string;
  selectedRoleId: string | null;
  usedRoleIds: string[];
  onOpenChange: (open: boolean) => void;
  onSelect: (roleId: string | null) => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Viewport className="dialog-viewport">
          <Dialog.Popup className="token-case">
            <header className="token-case-header">
              <div>
                <span className="utility-label">Token case</span>
                <Dialog.Title>{title}</Dialog.Title>
              </div>
              <IconButton
                label="Close character picker"
                variant="quiet"
                tooltip={false}
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
              </IconButton>
            </header>

            <div className="token-case-controls">
              <div className="token-search">
                <Search aria-hidden="true" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or ability"
                  autoFocus
                />
              </div>
            </div>

            <div className="token-case-scroll">
              {selectedRoleId && (
                <button
                  type="button"
                  className="clear-character-button"
                  onClick={() => onSelect(null)}
                >
                  <CircleSlash2 className="size-5" />
                  <span>Leave unassigned</span>
                </button>
              )}
              <CharacterCatalog
                editionId={editionId}
                query={query}
                selectedRoleIds={selectedRoleId ? [selectedRoleId] : []}
                usedRoleIds={usedRoleIds}
                onSelect={onSelect}
              />
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
