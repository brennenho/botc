export type CharacterSheetSocialCardId = "tb" | "bmr" | "snv" | "travellers";

type CharacterSheetSocialCardConfig = {
  imagePath: string;
  imageAlt: string;
  artworkPath: string;
};

export const socialCardSize = { width: 1200, height: 630 } as const;
export const socialCardContentType = "image/png";

export const characterSheetSocialCards = {
  tb: {
    imagePath: "/tb/opengraph-image",
    imageAlt: "Trouble Brewing character reference for Blood on the Clocktower",
    artworkPath: "assets/seo/editions/tb.png",
  },
  bmr: {
    imagePath: "/bmr/opengraph-image",
    imageAlt: "Bad Moon Rising character reference for Blood on the Clocktower",
    artworkPath: "assets/seo/editions/bmr.png",
  },
  snv: {
    imagePath: "/snv/opengraph-image",
    imageAlt: "Sects & Violets character reference for Blood on the Clocktower",
    artworkPath: "assets/seo/editions/snv.png",
  },
  travellers: {
    imagePath: "/travellers/opengraph-image",
    imageAlt: "Traveller character reference for Blood on the Clocktower",
    artworkPath: "assets/seo/editions/travellers.png",
  },
} as const satisfies Record<
  CharacterSheetSocialCardId,
  CharacterSheetSocialCardConfig
>;
