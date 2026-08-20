import {
  characterSheetSocialCards,
  socialCardContentType,
  socialCardSize,
} from "@/components/seo/character-sheet-social-card-config";
import { createCharacterSheetSocialCardImage } from "@/components/seo/character-sheet-social-card-image";

export const alt = characterSheetSocialCards.bmr.imageAlt;
export const size = socialCardSize;
export const contentType = socialCardContentType;

export default function BadMoonRisingOpenGraphImage() {
  return createCharacterSheetSocialCardImage("bmr");
}
