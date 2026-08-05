import { PlayerApp } from "@/components/player/player-app";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string; seatId: string }>;
}) {
  const { id, seatId } = await params;
  return <PlayerApp gameId={id} seatId={seatId} />;
}
