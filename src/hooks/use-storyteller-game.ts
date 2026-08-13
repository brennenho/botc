"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useGameInvalidation } from "@/hooks/use-game-invalidation";
import { fetchStorytellerGame, updateStorytellerGame } from "@/lib/api";
import type {
  StorytellerPatch,
  StorytellerSnapshot,
} from "@/lib/game-data/types";

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
      version: snapshot.game.version + 1,
    },
    seats: patch.seats ?? snapshot.seats,
    gameTokens: patch.gameTokens ?? snapshot.gameTokens,
  };
}

function hasChanges(patch: StorytellerPatch) {
  return Object.keys(patch).length > 0;
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
  const refreshQueuedRef = useRef(false);
  const snapshotRef = useRef<StorytellerSnapshot | null>(null);
  const serverVersionRef = useRef<number | null>(null);
  const queueFailedRef = useRef(false);
  const queueFailureMessageRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const result = await fetchStorytellerGame(gameCode);
      if (requestId === requestIdRef.current && pendingRef.current === 0) {
        serverVersionRef.current = result.snapshot.game.version;
        snapshotRef.current = result.snapshot;
        setSnapshot(result.snapshot);
      }
      if (requestId === requestIdRef.current) setError(null);
    } catch (cause) {
      if (requestId === requestIdRef.current) {
        setError(
          cause instanceof Error ? cause.message : "Unable to load game.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [gameCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestRefresh = useCallback(() => {
    if (pendingRef.current > 0) {
      refreshQueuedRef.current = true;
      return;
    }
    void refresh();
  }, [refresh]);

  useGameInvalidation({
    gameCode,
    onInvalidate: requestRefresh,
  });

  const commit = useCallback(
    (update: StorytellerUpdate) => {
      const current = snapshotRef.current;
      if (!current) return;
      const patch = typeof update === "function" ? update(current) : update;
      if (!hasChanges(patch)) return;
      const optimisticSnapshot = applyPatch(current, patch);
      snapshotRef.current = optimisticSnapshot;
      setSnapshot(optimisticSnapshot);

      pendingRef.current += 1;
      setSaveState("saving");
      setError(null);

      queueRef.current = queueRef.current.then(async () => {
        let savedSnapshot: StorytellerSnapshot | null = null;

        if (!queueFailedRef.current) {
          try {
            const expectedVersion = serverVersionRef.current;
            if (expectedVersion === null) {
              throw new Error("The game is still loading. Try again.");
            }

            const result = await updateStorytellerGame(gameCode, {
              ...patch,
              expectedVersion,
            });
            serverVersionRef.current = result.snapshot.game.version;
            savedSnapshot = result.snapshot;
          } catch (cause) {
            queueFailedRef.current = true;
            queueFailureMessageRef.current =
              cause instanceof Error ? cause.message : "Unable to save game.";
          }
        }

        pendingRef.current = Math.max(0, pendingRef.current - 1);
        if (pendingRef.current > 0) return;

        const failureMessage = queueFailureMessageRef.current;
        const shouldReconcile =
          queueFailedRef.current || refreshQueuedRef.current;
        queueFailedRef.current = false;
        queueFailureMessageRef.current = null;
        refreshQueuedRef.current = false;

        if (shouldReconcile) {
          await refresh();
        } else if (savedSnapshot) {
          snapshotRef.current = savedSnapshot;
          setSnapshot(savedSnapshot);
        }

        if (failureMessage) {
          setSaveState("error");
          setError(failureMessage);
        } else {
          setSaveState("saved");
        }
      });
    },
    [gameCode, refresh],
  );

  return { snapshot, loading, error, saveState, commit, refresh };
}
