import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryExperience } from "@/components/entry/entry-experience";
import { isValidGameCode, normalizeGameCode } from "@/lib/game-code";

export const metadata: Metadata = {
  title: "Join a Game | Blood on the Clocktower",
  description: "Join a Blood on the Clocktower game.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JoinGamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const gameCode = normalizeGameCode(code);

  if (!isValidGameCode(gameCode)) notFound();

  return <EntryExperience initialJoinCode={gameCode} />;
}
