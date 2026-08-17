"use client";

import {
  CharacterSheet,
  type CharacterSheetId,
} from "@/components/character-sheet/character-sheet";
import type { EditionId } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export type CharacterReferenceView = "script" | "travellers";

export function CharacterReference({
  editionId,
  view,
  onViewChange,
}: {
  editionId: EditionId;
  view: CharacterReferenceView;
  onViewChange: (view: CharacterReferenceView) => void;
}) {
  const sheetId: CharacterSheetId =
    view === "travellers" ? "travellers" : editionId;
  const travellersSelected = view === "travellers";

  function selectTab(nextView: CharacterReferenceView) {
    onViewChange(nextView);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        role="tablist"
        aria-label="Character Reference"
        className="flex shrink-0 border-b border-black/12 bg-black/[0.025]"
      >
        <ReferenceTab
          id="reference-script-tab"
          active={!travellersSelected}
          label="Script"
          onSelect={() => selectTab("script")}
          onMove={() => selectTab("travellers")}
        />
        <ReferenceTab
          id="reference-travellers-tab"
          active={travellersSelected}
          label="Travellers"
          onSelect={() => selectTab("travellers")}
          onMove={() => selectTab("script")}
        />
      </div>
      <div
        id="character-reference-panel"
        role="tabpanel"
        aria-labelledby={
          travellersSelected
            ? "reference-travellers-tab"
            : "reference-script-tab"
        }
        className="min-h-0 flex-1"
      >
        <CharacterSheet sheetId={sheetId} />
      </div>
    </div>
  );
}

function ReferenceTab({
  id,
  active,
  label,
  onSelect,
  onMove,
}: {
  id: string;
  active: boolean;
  label: string;
  onSelect: () => void;
  onMove: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls="character-reference-panel"
      tabIndex={active ? 0 : -1}
      className={cn(
        "-mb-px min-h-11 flex-1 border-b-2 border-transparent px-3 text-[11px] font-semibold text-black/48 transition-colors hover:text-black/76 focus-visible:outline-none",
        active && "border-black/55 text-black/82",
      )}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const tabs = Array.from(
          event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]',
          ) ?? [],
        );
        const currentIndex = tabs.indexOf(event.currentTarget);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        tabs[(currentIndex + direction + tabs.length) % tabs.length]?.focus();
        onMove();
      }}
    >
      {label}
    </button>
  );
}
