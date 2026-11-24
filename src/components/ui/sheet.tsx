"use client";

import * as React from "react";

import { Modal, ModalHeader } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  suspended?: boolean;
  eyebrow?: string;
  headerActions?: React.ReactNode;
  modal?: boolean;
  backdrop?: boolean;
  disablePointerDismissal?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Sheet({
  open,
  onOpenChange,
  title,
  suspended = false,
  eyebrow,
  headerActions,
  modal = true,
  backdrop = true,
  disablePointerDismissal = false,
  className,
  children,
}: SheetProps) {
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        const escapeWasHandled =
          eventDetails.reason === "escape-key" &&
          (suspended || eventDetails.event.defaultPrevented);

        if (!nextOpen && escapeWasHandled) {
          eventDetails.cancel();
          return;
        }
        onOpenChange(nextOpen);
      }}
      modal={modal}
      disablePointerDismissal={disablePointerDismissal}
      backdropClassName={backdrop && "sheet-scrim"}
      viewportClassName="sheet-viewport"
      className={cn("side-sheet", suspended && "is-suspended", className)}
      initialFocus={titleRef}
      inert={suspended || undefined}
      aria-hidden={suspended || undefined}
      data-suspended={suspended ? "" : undefined}
    >
      <ModalHeader
        title={title}
        titleRef={titleRef}
        closeLabel={`Close ${title}`}
        eyebrow={eyebrow}
        actions={headerActions}
      />
      {children}
    </Modal>
  );
}
