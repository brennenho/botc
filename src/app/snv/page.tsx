import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";
import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Sects & Violets",
  path: "/snv",
  description:
    "Explore every Sects & Violets character and ability in this Blood on the Clocktower reference sheet.",
});

export default function SectsAndVioletsCharacterSheetPage() {
  return <CharacterSheetPage sheetId="snv" />;
}
