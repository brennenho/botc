import { notFound } from "next/navigation";

import { StorytellerApp } from "@/components/grimoire/storyteller-app";
import { getGameIdByJoinCode } from "@/lib/server/store";

export default async function StorytellerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const gameId = await getGameIdByJoinCode(code);
  if (!gameId) notFound();

  return <StorytellerApp gameId={gameId} />;
}
