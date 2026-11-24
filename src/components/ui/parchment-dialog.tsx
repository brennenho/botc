"use client";

import { useRef, type ReactNode, type RefObject } from "react";

import { Modal, ModalDescription, ModalHeader } from "@/components/ui/modal";

type ParchmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  closeLabel: string;
  finalFocus?: RefObject<HTMLElement | null>;
  size?: "sm" | "md";
  children: ReactNode;
};

export function ParchmentDialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  finalFocus,
  size = "md",
  children,
}: ParchmentDialogProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="parchment-dialog"
      data-size={size}
      backdropClassName="dialog-backdrop parchment-dialog-backdrop"
      viewportClassName="dialog-viewport parchment-dialog-viewport"
      initialFocus={titleRef}
      finalFocus={finalFocus}
    >
      <ModalHeader
        className="parchment-dialog-header"
        title={title}
        titleRef={titleRef}
        closeLabel={closeLabel}
      />
      <ModalDescription className="parchment-dialog-description">
        {description}
      </ModalDescription>
      {children}
    </Modal>
  );
}
