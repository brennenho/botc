import { ImageResponse } from "next/og";

import { SocialCard } from "@/components/seo/social-card";

export const alt =
  "An invitation to join a Blood on the Clocktower game on BOTC Town";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function InvitationOpenGraphImage() {
  return new ImageResponse(
    <SocialCard
      eyebrow="GAME INVITATION"
      title={"YOU'RE\nINVITED"}
      description="Join your Storyteller's Blood on the Clocktower game on BOTC Town."
    />,
    size,
  );
}
