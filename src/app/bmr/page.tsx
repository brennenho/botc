import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";
import { characterSheetSocialCards } from "@/components/seo/character-sheet-social-card-config";
import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Bad Moon Rising",
  path: "/bmr",
  description:
    "Explore every Bad Moon Rising character and ability in this Blood on the Clocktower reference sheet.",
  image: characterSheetSocialCards.bmr.imagePath,
  imageAlt: characterSheetSocialCards.bmr.imageAlt,
});

export default function BadMoonRisingCharacterSheetPage() {
  return <CharacterSheetPage sheetId="bmr" />;
}
