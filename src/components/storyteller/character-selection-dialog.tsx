"use client";

import type { ReactNode } from "react";

import {
  CharacterCatalog,
  type CharacterCatalogProps,
} from "@/components/storyteller/character-catalog";
import { ParchmentDialog } from "@/components/ui/parchment-dialog";

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
    <ParchmentDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      closeLabel={closeLabel}
      size="wide"
      footer={footer}
    >
      <CharacterCatalog {...catalogProps} />
    </ParchmentDialog>
  );
}
