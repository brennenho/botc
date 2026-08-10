import { notFound } from "next/navigation";

import { PlayerApp } from "@/components/player/player-app";
import { normalizeGameCode } from "@/lib/game-code";
import { gameExistsByCode } from "@/lib/server/store";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ code: string; seatId: string }>;
}) {
  const { code, seatId } = await params;
  const gameCode = normalizeGameCode(code);
  if (!(await gameExistsByCode(gameCode))) notFound();

  return <PlayerApp gameCode={gameCode} seatId={seatId} />;
}
