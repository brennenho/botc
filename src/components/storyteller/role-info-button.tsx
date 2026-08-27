"use client";

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/game-data";

export function RoleInfoButton({ role }: { role: Role }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={350}
        closeDelay={80}
        render={
          <Button
            type="button"
            size="icon"
            variant="quiet"
            className="role-info-button"
            aria-label={`About ${role.name}`}
          >
            <Info aria-hidden="true" />
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner
          side="top"
          sideOffset={9}
          collisionPadding={10}
          className="site-info-popover-positioner"
        >
          <Popover.Popup className="site-info-popover role-ability-popover">
            <Popover.Arrow className="site-info-popover-arrow" />
            <Popover.Title className="role-ability-popover-title">
              {role.name}
            </Popover.Title>
            <Popover.Description className="role-ability-popover-description">
              {role.ability}
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
