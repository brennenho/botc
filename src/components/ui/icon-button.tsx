import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type IconButtonProps = Omit<ButtonProps, "size"> & {
  label: string;
  size?: "sm" | "md";
  tooltip?: React.ReactNode | false;
};

export function IconButton({
  label,
  className,
  size = "md",
  tooltip,
  ...props
}: IconButtonProps) {
  const button = (
    <Button
      aria-label={label}
      size="icon"
      className={cn(size === "sm" && "size-8", className)}
      {...props}
    />
  );

  if (tooltip === false) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{tooltip ?? label}</TooltipContent>
    </Tooltip>
  );
}
