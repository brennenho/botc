"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchStorytellerGame, updateStorytellerGame } from "@/lib/api";
import type {
  StorytellerPatch,
  StorytellerSnapshot,
} from "@/lib/game-data/types";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type StorytellerUpdate =
  | StorytellerPatch
  | ((snapshot: StorytellerSnapshot) => StorytellerPatch);

export type StorytellerCommit = (update: StorytellerUpdate) => void;

function applyPatch(
  snapshot: StorytellerSnapshot,
  patch: StorytellerPatch,
): StorytellerSnapshot {
  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      phase: patch.phase ?? snapshot.game.phase,
      dayNumber: patch.dayNumber ?? snapshot.game.dayNumber,
      status: patch.status ?? snapshot.game.status,
    },
    seats: patch.seats ?? snapshot.seats,
    gameTokens: patch.gameTokens ?? snapshot.gameTokens,
  };
}

export function useStorytellerGame(gameCode: string) {
  const [snapshot, setSnapshot] = useState<StorytellerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const snapshotRef = useRef<StorytellerSnapshot | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchStorytellerGame(gameCode);
      if (pendingRef.current === 0) {
        snapshotRef.current = result.snapshot;
        setSnapshot(result.snapshot);
      }
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load game.");
    } finally {
      setLoading(false);
    }
  }, [gameCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel(`game-version-${gameCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `join_code=eq.${gameCode}`,
        },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [gameCode, refresh]);

  const commit = useCallback(
    (update: StorytellerUpdate) => {
      const current = snapshotRef.current;
      if (!current) return;
      const patch = typeof update === "function" ? update(current) : update;
      const optimisticSnapshot = applyPatch(current, patch);
      snapshotRef.current = optimisticSnapshot;
      setSnapshot(optimisticSnapshot);

      pendingRef.current += 1;
      setSaveState("saving");
      setError(null);

      queueRef.current = queueRef.current.then(async () => {
        try {
          const result = await updateStorytellerGame(gameCode, patch);
          pendingRef.current -= 1;
          if (pendingRef.current === 0) {
            snapshotRef.current = result.snapshot;
            setSnapshot(result.snapshot);
            setSaveState("saved");
          }
        } catch (cause) {
          pendingRef.current = Math.max(0, pendingRef.current - 1);
          setSaveState("error");
          setError(
            cause instanceof Error ? cause.message : "Unable to save game.",
          );
          if (pendingRef.current === 0) await refresh();
        }
      });
    },
    [gameCode, refresh],
  );

  return { snapshot, loading, error, saveState, commit, refresh };
}
