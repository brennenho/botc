"use client";

import { CircleSlash2, Skull, Vote } from "lucide-react";

import { CharacterToken } from "@/components/grimoire/character-token";
import { usePlayerGame } from "@/hooks/use-player-game";
import { getEdition, roleById, teamLabel } from "@/lib/game-data";

export function PlayerApp({
  gameCode,
  seatId,
}: {
  gameCode: string;
  seatId: string;
}) {
  const { snapshot, loading, error } = usePlayerGame(gameCode, seatId);

  if (loading) return <PlayerLoading />;
  if (error || !snapshot) {
    return (
      <main className="home-surface grid min-h-svh place-items-center px-6 text-center">
        <div>
          <CircleSlash2 className="mx-auto mb-4 size-7 text-black/40" />
          <p className="font-display text-2xl">This Seat Is Unavailable</p>
          <p className="mt-2 text-sm text-black/50">{error}</p>
        </div>
      </main>
    );
  }

  const role = snapshot.seat.roleId ? roleById.get(snapshot.seat.roleId) : null;
  const edition = getEdition(snapshot.game.edition);

  return (
    <main className="home-surface min-h-svh px-6 py-8 text-[var(--ink)]">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg flex-col">
        <header className="flex items-center justify-between border-b border-black/10 pb-5">
          <div>
            <p className="text-xs font-semibold text-black/45 uppercase">
              {edition.name}
            </p>
            <h1 className="font-display mt-1 text-2xl">
              {snapshot.seat.playerName}
            </h1>
          </div>
          <span className="font-mono text-sm font-semibold text-black/45">
            {snapshot.game.joinCode}
          </span>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          {role ? (
            <>
              <CharacterToken
                role={role}
                size="fill"
                appearance="bare"
                presentation="token"
                showName
                priority
                className="player-role-token"
              />
              <p className="mt-7 text-xs font-bold text-black/45 uppercase">
                {teamLabel(role.team)} ·{" "}
                {snapshot.seat.alignment === "good" ? "Good" : "Evil"}
              </p>
              <h2 className="font-display mt-2 text-4xl">
                You Are the {role.name}
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-black/65">
                {role.ability}
              </p>
            </>
          ) : (
            <>
              <div className="empty-player-role" />
              <h2 className="font-display mt-6 text-3xl">
                Awaiting Your Character
              </h2>
            </>
          )}
        </section>

        <footer className="flex items-center justify-center gap-6 border-t border-black/10 pt-5 text-sm font-medium text-black/55">
          <span className="flex items-center gap-2">
            {snapshot.seat.alive ? (
              <Vote className="size-4" />
            ) : (
              <Skull className="size-4" />
            )}
            {snapshot.seat.alive ? "Alive" : "Dead"}
          </span>
          {!snapshot.seat.alive && (
            <span className="flex items-center gap-2">
              <Vote className="size-4" />
              {snapshot.seat.ghostVoteAvailable
                ? "Ghost Vote Available"
                : "Vote Used"}
            </span>
          )}
        </footer>
      </div>
    </main>
  );
}

function PlayerLoading() {
  return (
    <main className="home-surface grid min-h-svh place-items-center">
      <div className="size-6 animate-spin rounded-full border-2 border-black/15 border-t-black/60" />
    </main>
  );
}
