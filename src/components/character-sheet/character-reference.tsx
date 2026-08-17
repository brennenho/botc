"use client";

import { BookOpen, Compass } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  CharacterSheet,
  type CharacterSheetId,
} from "@/components/character-sheet/character-sheet";
import type { EditionId } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export function CharacterReference({ editionId }: { editionId: EditionId }) {
  const [sheetId, setSheetId] = useState<CharacterSheetId>(editionId);

  return (
    <CharacterSheet
      sheetId={sheetId}
      headerActions={
        <div
          role="tablist"
          aria-label="Character Reference"
          className="grid w-full grid-cols-2 rounded-[var(--radius-control)] bg-black/[0.055] p-0.5"
        >
          <ReferenceTab
            active={sheetId !== "travellers"}
            icon={<BookOpen aria-hidden="true" />}
            label="Script"
            onClick={() => setSheetId(editionId)}
          />
          <ReferenceTab
            active={sheetId === "travellers"}
            icon={<Compass aria-hidden="true" />}
            label="Travellers"
            onClick={() => setSheetId("travellers")}
          />
        </div>
      }
    />
  );
}

function ReferenceTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        "flex min-h-8 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] px-3 text-[11px] font-semibold text-black/50 transition-colors hover:text-black/78 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)]",
        active &&
          "bg-[#fbf6e9] text-black/82 shadow-[0_1px_3px_rgb(54_37_17/0.14)]",
      )}
      onClick={onClick}
    >
      <span className="[&>svg]:size-3.5">{icon}</span>
      {label}
    </button>
  );
}
