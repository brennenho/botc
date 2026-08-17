import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";

export const metadata: Metadata = {
  title: "Bad Moon Rising Character Sheet | Blood on the Clocktower",
  description: "Bad Moon Rising characters and abilities.",
};

export default function BadMoonRisingCharacterSheetPage() {
  return <CharacterSheetPage sheetId="bmr" />;
}
