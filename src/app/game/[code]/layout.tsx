import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Game",
  path: "/game",
  description: "A private Blood on the Clocktower game.",
  index: false,
});

export default function GameLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
