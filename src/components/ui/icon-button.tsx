import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type IconButtonProps = Omit<ButtonProps, "size"> & {
  label: string;
  size?: "sm" | "md";
  tooltip?: React.ReactNode | false;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  shortcut?: string;
};

export function IconButton({
  label,
  className,
  size = "md",
  tooltip,
  tooltipSide = "top",
  shortcut,
  ...props
}: IconButtonProps) {
  const button = (
    <Button
      aria-label={label}
      size="icon"
      className={cn(size === "sm" && "size-8", className)}
      aria-keyshortcuts={shortcut}
      {...props}
    />
  );

  if (tooltip === false) return button;

  return (
    <Tooltip
      content={tooltip ?? label}
      shortcuts={shortcut ? [shortcut] : undefined}
      side={tooltipSide}
    >
      {button}
    </Tooltip>
  );
}
