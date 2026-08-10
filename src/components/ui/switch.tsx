"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import * as React from "react";

import { cn } from "@/lib/utils";

export type SwitchProps = React.ComponentPropsWithoutRef<
  typeof BaseSwitch.Root
>;

export const Switch = React.forwardRef<HTMLElement, SwitchProps>(
  function Switch({ className, ...props }, ref) {
    return (
      <BaseSwitch.Root
        ref={ref}
        className={cn("ui-switch", className)}
        {...props}
      >
        <BaseSwitch.Thumb className="ui-switch-thumb" />
      </BaseSwitch.Root>
    );
  },
);
