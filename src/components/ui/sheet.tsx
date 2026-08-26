"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import * as React from "react";

import { IconButton } from "@/components/ui/icon-button";
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
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && suspended && eventDetails.reason === "escape-key") {
          eventDetails.cancel();
          return;
        }
        onOpenChange(nextOpen);
      }}
      modal={modal}
      disablePointerDismissal={disablePointerDismissal}
    >
      <Dialog.Portal>
        {backdrop && <Dialog.Backdrop className="sheet-scrim" />}
        <Dialog.Viewport className="sheet-viewport">
          <Dialog.Popup
            className={cn("side-sheet", suspended && "is-suspended", className)}
            initialFocus={titleRef}
            inert={suspended ? true : undefined}
            aria-hidden={suspended ? true : undefined}
            data-suspended={suspended ? "" : undefined}
          >
            <header className="sheet-header">
              <div>
                {eyebrow && <p className="panel-eyebrow">{eyebrow}</p>}
                <Dialog.Title
                  ref={titleRef}
                  tabIndex={-1}
                  className="sheet-title"
                >
                  {title}
                </Dialog.Title>
              </div>
              <div className="sheet-header-actions">
                {headerActions}
                <Dialog.Close
                  render={
                    <IconButton
                      label={`Close ${title}`}
                      variant="quiet"
                      tooltip={false}
                    >
                      <X className="size-4" />
                    </IconButton>
                  }
                />
              </div>
            </header>
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
