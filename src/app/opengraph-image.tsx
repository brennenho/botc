import { ImageResponse } from "next/og";

import { SocialCard, socialCardFonts } from "@/components/seo/social-card";

export const alt = "A shared online grimoire for Blood on the Clocktower";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<SocialCard variant="home" />, {
    ...size,
    fonts: socialCardFonts,
  });
}
