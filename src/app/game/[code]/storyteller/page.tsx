import { notFound } from "next/navigation";

import { StorytellerApp } from "@/components/storyteller/storyteller-app";
import { normalizeGameCode } from "@/lib/game-code";
import { gameExistsByCode } from "@/lib/server/store";

export default async function StorytellerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const gameCode = normalizeGameCode(code);
  if (!(await gameExistsByCode(gameCode))) notFound();

  return <StorytellerApp gameCode={gameCode} />;
}
