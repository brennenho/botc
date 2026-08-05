"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

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

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

type TooltipContentProps = React.ComponentProps<
  typeof TooltipPrimitive.Popup
> & {
  side?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["side"];
  align?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["align"];
  sideOffset?: number;
  alignOffset?: number;
};

export function TooltipContent({
  className,
  side = "top",
  align = "center",
  sideOffset = 9,
  alignOffset = 0,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={10}
        className="site-tooltip-positioner"
      >
        <TooltipPrimitive.Popup
          className={cn("site-tooltip-popup", className)}
          {...props}
        >
          <TooltipPrimitive.Arrow className="site-tooltip-arrow" />
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}
