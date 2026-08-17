"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type GrimoirePanelTab = {
  id: string;
  icon: ReactNode;
  label: string;
  displayLabel?: string;
  active?: boolean;
  onClick: () => void;
};

export function GrimoirePanelTabs({
  tabs,
  sheetOpen,
  className,
}: {
  tabs: GrimoirePanelTab[];
  sheetOpen: boolean;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "grimoire-panel-tabs global-dock",
        sheetOpen && "is-sheet-open",
        className,
      )}
      aria-label="Grimoire Panels"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-label={tab.label}
          aria-pressed={tab.active}
          className={cn("panel-tab-button", tab.active && "is-active")}
          data-panel-tab={tab.id}
          onClick={tab.onClick}
        >
          <span className="panel-tab-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="panel-tab-label">
            {tab.displayLabel ?? tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
