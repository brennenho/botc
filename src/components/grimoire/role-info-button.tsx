"use client";

import { Info } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Role } from "@/lib/game-data";

export function RoleInfoButton({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open}>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="quiet"
            className="role-info-button"
            aria-label={`About ${role.name}`}
            onPointerEnter={() => setOpen(true)}
            onPointerLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          >
            <Info aria-hidden="true" />
          </Button>
        }
      />
      <TooltipContent className="role-ability-tooltip">
        <strong>{role.name}</strong>
        <span>{role.ability}</span>
      </TooltipContent>
    </Tooltip>
  );
}
