import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";
import { characterSheetSocialCards } from "@/components/seo/character-sheet-social-card-config";
import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Sects & Violets",
  path: "/snv",
  description:
    "Explore every Sects & Violets character and ability in this Blood on the Clocktower reference sheet.",
  image: characterSheetSocialCards.snv.imagePath,
  imageAlt: characterSheetSocialCards.snv.imageAlt,
});

export default function SectsAndVioletsCharacterSheetPage() {
  return <CharacterSheetPage sheetId="snv" />;
}
