"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import {
  CharacterCatalog,
  type CharacterCatalogProps,
} from "@/components/storyteller/character-catalog";
import { IconButton } from "@/components/ui/icon-button";

export function CharacterSelectionDialog({
  open,
  title,
  closeLabel,
  footer,
  onOpenChange,
  ...catalogProps
}: CharacterCatalogProps & {
  open: boolean;
  title: string;
  closeLabel: string;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Viewport className="dialog-viewport">
          <Dialog.Popup className="token-case" data-keyboard-shortcuts-modal>
            <header className="token-case-header">
              <Dialog.Title>{title}</Dialog.Title>
              <IconButton
                label={closeLabel}
                variant="quiet"
                size="sm"
                tooltip={false}
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
              </IconButton>
            </header>

            <div className="token-case-scroll">
              <CharacterCatalog {...catalogProps} />
            </div>

            {footer}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
