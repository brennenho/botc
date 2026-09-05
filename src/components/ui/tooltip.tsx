"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import * as React from "react";

import { floatingHelp } from "@/components/ui/floating-help";
import { ShortcutHint } from "@/components/ui/shortcut-key";

export function TooltipProvider({
  delay = 350,
  closeDelay = 60,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delay={delay}
      closeDelay={closeDelay}
      {...props}
    />
  );
}

type TooltipProps = Pick<
  React.ComponentProps<typeof TooltipPrimitive.Root>,
  "open" | "onOpenChange"
> & {
  children: React.ReactElement;
  content: React.ReactNode;
  shortcuts?: readonly string[];
  shortcutSize?: "sm" | "md";
  side?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["side"];
  align?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["align"];
  sideOffset?: number;
  alignOffset?: number;
};

export function Tooltip({
  children,
  content,
  shortcuts,
  shortcutSize = "md",
  side = "top",
  align = "center",
  sideOffset = floatingHelp.sideOffset,
  alignOffset = 0,
  open,
  onOpenChange,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          collisionPadding={floatingHelp.collisionPadding}
          className={floatingHelp.positionerClassName}
          data-preferred-side={side}
        >
          <TooltipPrimitive.Popup
            className={`${floatingHelp.popupClassName} site-tooltip-popup`}
          >
            <TooltipPrimitive.Arrow className={floatingHelp.arrowClassName} />
            {shortcuts?.length ? (
              <ShortcutHint
                label={content}
                shortcuts={shortcuts}
                size={shortcutSize}
              />
            ) : (
              content
            )}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
