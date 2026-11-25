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
          <Dialog.Backdrop
            className={backdropClassName}
            data-modal-backdrop=""
          />
        )}
        <Dialog.Viewport className={viewportClassName}>
          <Dialog.Popup
            data-modal-surface=""
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

export function ModalHeader({
  title,
  titleRef,
  closeLabel,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
  closeLabel: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="modal-header">
      <div className="modal-heading">
        {eyebrow && <p className="panel-eyebrow">{eyebrow}</p>}
        <ModalTitle ref={titleRef} tabIndex={-1}>
          {title}
        </ModalTitle>
        {description && (
          <Dialog.Description className="modal-description">
            {description}
          </Dialog.Description>
        )}
      </div>
      <div className="modal-header-actions">
        {actions}
        <Dialog.Close
          render={
            <IconButton label={closeLabel} variant="quiet" tooltip={false}>
              <X className="size-4" aria-hidden="true" />
            </IconButton>
          }
        />
      </div>
    </header>
  );
}
