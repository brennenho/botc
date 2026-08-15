import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";

export const metadata: Metadata = {
  title: "Sects & Violets Character Sheet | Blood on the Clocktower",
  description: "Sects & Violets characters and abilities.",
};

export default function SectsAndVioletsCharacterSheetPage() {
  return <CharacterSheetPage editionId="snv" />;
}
