"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

type ConfirmRemoveButtonProps = {
  itemLabel: string;
  idleLabel: string;
  onRemove: () => void;
  display?: "icon" | "label";
  className?: string;
};

export function ConfirmRemoveButton({
  itemLabel,
  idleLabel,
  onRemove,
  display = "label",
  className,
}: ConfirmRemoveButtonProps) {
  const [armed, setArmed] = useState(false);
  const confirmLabel = `Click again to remove ${itemLabel}`;

  useEffect(() => setArmed(false), [itemLabel]);

  useEffect(() => {
    if (!armed) return;
    const timeout = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [armed]);

  function handleClick() {
    if (armed) {
      onRemove();
      setArmed(false);
      return;
    }
    setArmed(true);
  }

  const sharedProps = {
    "aria-pressed": armed,
    onClick: handleClick,
    className: cn("remove-player-button", armed && "is-confirming", className),
  };

  if (display === "icon") {
    return (
      <IconButton
        label={armed ? confirmLabel : idleLabel}
        size="sm"
        variant="danger"
        tooltipSide="left"
        {...sharedProps}
      >
        <Trash2 className="size-3.5" />
      </IconButton>
    );
  }

  return (
    <Button size="sm" variant="danger" {...sharedProps}>
      <Trash2 className="size-4" />
      {armed ? "Click again to remove" : idleLabel}
    </Button>
  );
}

export function RemovePlayerButton({
  playerName,
  ...props
}: Omit<ConfirmRemoveButtonProps, "itemLabel" | "idleLabel"> & {
  playerName: string;
}) {
  return (
    <ConfirmRemoveButton
      itemLabel={playerName}
      idleLabel={`Remove ${props.display === "icon" ? playerName : "player"}`}
      {...props}
    />
  );
}
