import { ImageResponse } from "next/og";

import { SocialCard } from "@/components/seo/social-card";

export const alt = "A shared online grimoire for Blood on the Clocktower";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const { loadSocialCardAssets } =
    await import("@/components/seo/social-card-assets");
  const { fonts, impImage, parchmentImage } = loadSocialCardAssets();

  return new ImageResponse(
    <SocialCard
      variant="home"
      parchmentImage={parchmentImage}
      artworkImage={impImage}
    />,
    {
      ...size,
      fonts,
    },
  );
}
