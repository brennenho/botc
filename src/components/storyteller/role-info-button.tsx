"use client";

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { floatingHelp } from "@/components/ui/floating-help";
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
          sideOffset={floatingHelp.sideOffset}
          collisionPadding={floatingHelp.collisionPadding}
          className={floatingHelp.positionerClassName}
          data-preferred-side="top"
        >
          <Popover.Popup
            className={`${floatingHelp.popupClassName} role-ability-popover`}
          >
            <Popover.Arrow className={floatingHelp.arrowClassName} />
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
