import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { PlayerApp } from "@/components/player/player-app";
import { normalizeGameCode } from "@/lib/game-code";
import { playerCookieName } from "@/lib/server/auth-cookies";
import { GameStoreError } from "@/lib/server/errors";
import { getPlayerSnapshotByCode } from "@/lib/server/store";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ code: string; seatId: string }>;
}) {
  const { code, seatId } = await params;
  const gameCode = normalizeGameCode(code);
  const credential =
    (await cookies()).get(playerCookieName(gameCode, seatId))?.value ?? "";

  try {
    await getPlayerSnapshotByCode(gameCode, seatId, credential);
  } catch (error) {
    if (
      error instanceof GameStoreError &&
      (error.code === "not_found" || error.code === "unauthorized")
    ) {
      notFound();
    }

    throw error;
  }

  return <PlayerApp gameCode={gameCode} seatId={seatId} />;
}
