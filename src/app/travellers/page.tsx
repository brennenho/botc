import type { Metadata } from "next";

import { CharacterSheetPage } from "@/components/character-sheet/character-sheet-page";
import { characterSheetSocialCards } from "@/components/seo/character-sheet-social-card-config";
import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Travellers",
  path: "/travellers",
  description:
    "Explore Blood on the Clocktower Traveller characters and abilities across Trouble Brewing, Bad Moon Rising, and Sects & Violets.",
  image: characterSheetSocialCards.travellers.imagePath,
  imageAlt: characterSheetSocialCards.travellers.imageAlt,
});

export default function TravellerCharacterSheetPage() {
  return <CharacterSheetPage sheetId="travellers" />;
}
