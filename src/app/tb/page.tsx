import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";
import { characterSheetSocialCards } from "@/components/seo/character-sheet-social-card-config";
import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Trouble Brewing",
  path: "/tb",
  description:
    "Explore every Trouble Brewing character and ability in this Blood on the Clocktower reference sheet.",
  image: characterSheetSocialCards.tb.imagePath,
  imageAlt: characterSheetSocialCards.tb.imageAlt,
});

export default function TroubleBrewingCharacterSheetPage() {
  return <CharacterSheetPage sheetId="tb" />;
}
