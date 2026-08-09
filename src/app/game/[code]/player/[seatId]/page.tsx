import { notFound } from "next/navigation";

import { PlayerApp } from "@/components/player/player-app";
import { getGameIdByJoinCode } from "@/lib/server/store";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ code: string; seatId: string }>;
}) {
  const { code, seatId } = await params;
  const gameId = await getGameIdByJoinCode(code);
  if (!gameId) notFound();

  return <PlayerApp gameId={gameId} seatId={seatId} />;
}
