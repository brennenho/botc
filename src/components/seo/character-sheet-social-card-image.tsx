import { ImageResponse } from "next/og";

import {
  socialCardSize,
  type CharacterSheetSocialCardId,
} from "@/components/seo/character-sheet-social-card-config";
import { SocialCard } from "@/components/seo/social-card";

export async function createCharacterSheetSocialCardImage(
  sheetId: CharacterSheetSocialCardId,
) {
  const { loadCharacterSheetSocialCardAssets } =
    await import("@/components/seo/social-card-assets");
  const { editionImage, fonts, parchmentImage } =
    loadCharacterSheetSocialCardAssets(sheetId);

  return new ImageResponse(
    <SocialCard
      variant="character-sheet"
      parchmentImage={parchmentImage}
      artworkImage={editionImage}
    />,
    {
      ...socialCardSize,
      fonts,
    },
  );
}
