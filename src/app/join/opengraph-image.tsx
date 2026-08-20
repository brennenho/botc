import { ImageResponse } from "next/og";

import { SocialCard } from "@/components/seo/social-card";

export const alt = "An invitation to join a Blood on the Clocktower game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function InvitationOpenGraphImage() {
  const { loadSocialCardAssets } =
    await import("@/components/seo/social-card-assets");
  const { fonts, impImage, parchmentImage } = loadSocialCardAssets();

  return new ImageResponse(
    <SocialCard
      variant="invitation"
      parchmentImage={parchmentImage}
      impImage={impImage}
    />,
    {
      ...size,
      fonts,
    },
  );
}
