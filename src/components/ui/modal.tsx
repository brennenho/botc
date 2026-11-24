"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { IconButton } from "@/components/ui/icon-button";

type ModalProps = Pick<
  Dialog.Root.Props,
  "onOpenChange" | "modal" | "disablePointerDismissal"
> &
  Omit<Dialog.Popup.Props, "children" | "render"> & {
    open: boolean;
    children: ReactNode;
    backdropClassName?: string | false;
    viewportClassName?: string;
  };

export function Modal({
  open,
  onOpenChange,
  modal = true,
  disablePointerDismissal,
  backdropClassName = "dialog-backdrop",
  viewportClassName = "dialog-viewport",
  children,
  ...popupProps
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={modal}
      disablePointerDismissal={disablePointerDismissal}
    >
      <Dialog.Portal>
        {backdropClassName !== false && (
          <Dialog.Backdrop className={backdropClassName} />
        )}
        <Dialog.Viewport className={viewportClassName}>
          <Dialog.Popup
            data-keyboard-shortcuts-modal={modal !== false || undefined}
            {...popupProps}
          >
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const ModalTitle = Dialog.Title;
export const ModalDescription = Dialog.Description;

export function ModalCloseButton({
  label,
  size,
}: {
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <Dialog.Close
      render={
        <IconButton label={label} size={size} variant="quiet" tooltip={false}>
          <X className="size-4" aria-hidden="true" />
        </IconButton>
      }
    />
  );
}

export function ModalHeader({
  title,
  titleRef,
  closeLabel,
  closeSize,
  className,
}: {
  title: string;
  titleRef?: RefObject<HTMLHeadingElement | null>;
  closeLabel: string;
  closeSize?: "sm" | "md";
  className: string;
}) {
  return (
    <header className={className}>
      <ModalTitle ref={titleRef} tabIndex={titleRef ? -1 : undefined}>
        {title}
      </ModalTitle>
      <ModalCloseButton label={closeLabel} size={closeSize} />
    </header>
  );
}
