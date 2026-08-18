import { notFound } from "next/navigation";

import { EntryExperience } from "@/components/entry/entry-experience";
import { isValidGameCode, normalizeGameCode } from "@/lib/game-code";

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
