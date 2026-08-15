import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";

export const metadata: Metadata = {
  title: "Trouble Brewing Character Sheet | Blood on the Clocktower",
  description: "Trouble Brewing characters and abilities.",
};

export default function TroubleBrewingCharacterSheetPage() {
  return <CharacterSheetPage editionId="tb" />;
}
