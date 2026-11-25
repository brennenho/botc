"use client";

import { useRef, type ReactNode, type RefObject } from "react";

import { Modal, ModalHeader } from "@/components/ui/modal";

type ParchmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  closeLabel: string;
  finalFocus?: RefObject<HTMLElement | null>;
  size?: "sm" | "md" | "wide";
  children: ReactNode;
};

export function ParchmentDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
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
      initialFocus={titleRef}
      finalFocus={finalFocus}
    >
      <ModalHeader
        description={description}
        title={title}
        titleRef={titleRef}
        closeLabel={closeLabel}
      />
      <div className="parchment-dialog-body">{children}</div>
      {footer && <footer className="parchment-dialog-footer">{footer}</footer>}
    </Modal>
  );
}
