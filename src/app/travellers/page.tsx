import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";
import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Travellers",
  path: "/travellers",
  description:
    "Explore Blood on the Clocktower Traveller characters and abilities across Trouble Brewing, Bad Moon Rising, and Sects & Violets.",
});

export default function TravellerCharacterSheetPage() {
  return <CharacterSheetPage sheetId="travellers" />;
}
