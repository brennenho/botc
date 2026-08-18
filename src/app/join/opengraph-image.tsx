import { ImageResponse } from "next/og";

import { SocialCard, socialCardFonts } from "@/components/seo/social-card";

export const alt = "An invitation to join a Blood on the Clocktower game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function InvitationOpenGraphImage() {
  return new ImageResponse(<SocialCard variant="invitation" />, {
    ...size,
    fonts: socialCardFonts,
  });
}
