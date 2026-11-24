"use client";

import type { ReactNode } from "react";

import {
  CharacterCatalog,
  type CharacterCatalogProps,
} from "@/components/storyteller/character-catalog";
import { Modal, ModalHeader } from "@/components/ui/modal";

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
    <Modal open={open} onOpenChange={onOpenChange} className="token-case">
      <ModalHeader
        className="token-case-header"
        title={title}
        closeLabel={closeLabel}
        closeSize="sm"
      />
      <div className="token-case-scroll">
        <CharacterCatalog {...catalogProps} />
      </div>
      {footer}
    </Modal>
  );
}
