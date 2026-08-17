import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";

export const metadata: Metadata = {
  title: "Traveller Character Sheet | Blood on the Clocktower",
  description: "Traveller characters and abilities across supported scripts.",
};

export default function TravellerCharacterSheetPage() {
  return <CharacterSheetPage sheetId="travellers" />;
}
