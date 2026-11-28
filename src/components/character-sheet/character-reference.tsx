"use client";

import { CharacterSheet } from "@/components/character-sheet/character-sheet";
import { Tabs } from "@/components/ui/tabs";
import type { GameScript } from "@/lib/game-data";

export type CharacterReferenceView = "script" | "travellers";

export function CharacterReference({
  editionId,
  view,
  onViewChange,
}: {
  editionId: GameScript;
  view: CharacterReferenceView;
  onViewChange: (view: CharacterReferenceView) => void;
}) {
  return (
    <Tabs
      label="Character Reference"
      value={view}
      onValueChange={onViewChange}
      tabs={[
        {
          value: "script",
          label: "Script",
          content: <CharacterSheet sheetId={editionId} />,
        },
        {
          value: "travellers",
          label: "Travellers",
          content: <CharacterSheet sheetId="travellers" />,
        },
      ]}
    />
  );
}
