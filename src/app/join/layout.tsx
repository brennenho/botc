import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Join Game",
  path: "/join",
  description:
    "You are invited to join your Storyteller's Blood on the Clocktower game.",
  image: "/join/opengraph-image",
  imageAlt: "An invitation to join a Blood on the Clocktower game",
  index: false,
});

export default function JoinLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
