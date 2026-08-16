"use client";

import { useCallback, useRef, useState } from "react";

import { useGameInvalidation } from "@/hooks/use-game-invalidation";
import { fetchStorytellerGame, updateStorytellerGame } from "@/lib/api";
import { toAppError, type AppError } from "@/lib/app-error";
import type {
  StorytellerPatch,
  StorytellerSnapshot,
} from "@/lib/game-data/types";

export type StorytellerUpdate =
  | StorytellerPatch
  | ((snapshot: StorytellerSnapshot) => StorytellerPatch);

export type StorytellerCommit = (update: StorytellerUpdate) => void;

export type StorytellerSaveError = {
  error: AppError;
  reconciled: boolean;
};

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
      version: snapshot.game.version + 1,
    },
    seats: patch.seats ?? snapshot.seats,
    gameTokens: patch.gameTokens ?? snapshot.gameTokens,
  };
}

function hasChanges(patch: StorytellerPatch) {
  return Object.keys(patch).length > 0;
}

export function useStorytellerGame(
  gameCode: string,
  initialSnapshot: StorytellerSnapshot,
) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [refreshStatus, setRefreshStatus] = useState<
    "idle" | "refreshing" | "error"
  >("idle");
  const [refreshError, setRefreshError] = useState<AppError | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">(
    "idle",
  );
  const [saveError, setSaveError] = useState<StorytellerSaveError | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const refreshQueuedRef = useRef(false);
  const snapshotRef = useRef<StorytellerSnapshot>(initialSnapshot);
  const serverVersionRef = useRef(initialSnapshot.game.version);
  const queueFailedRef = useRef(false);
  const queueFailureRef = useRef<AppError | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setRefreshStatus("refreshing");

    try {
      const result = await fetchStorytellerGame(gameCode);
      if (requestId !== requestIdRef.current) return false;
      if (pendingRef.current === 0) {
        serverVersionRef.current = result.snapshot.game.version;
        snapshotRef.current = result.snapshot;
        setSnapshot(result.snapshot);
      }
      setRefreshError(null);
      setRefreshStatus("idle");
      return true;
    } catch (cause) {
      if (requestId !== requestIdRef.current) return false;
      setRefreshError(toAppError(cause, "Unable to refresh the game."));
      setRefreshStatus("error");
      return false;
    }
  }, [gameCode]);

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
      const patch = typeof update === "function" ? update(current) : update;
      if (!hasChanges(patch)) return;
      const optimisticSnapshot = applyPatch(current, patch);
      snapshotRef.current = optimisticSnapshot;
      setSnapshot(optimisticSnapshot);

      pendingRef.current += 1;
      setSaveState("saving");
      setSaveError(null);

      queueRef.current = queueRef.current.then(async () => {
        let savedSnapshot: StorytellerSnapshot | null = null;

        if (!queueFailedRef.current) {
          try {
            const result = await updateStorytellerGame(gameCode, {
              ...patch,
              expectedVersion: serverVersionRef.current,
            });
            serverVersionRef.current = result.snapshot.game.version;
            savedSnapshot = result.snapshot;
          } catch (cause) {
            queueFailedRef.current = true;
            queueFailureRef.current = toAppError(
              cause,
              "Unable to save game changes.",
            );
          }
        }

        pendingRef.current = Math.max(0, pendingRef.current - 1);
        if (pendingRef.current > 0) return;

        const failure = queueFailureRef.current;
        const shouldReconcile =
          queueFailedRef.current || refreshQueuedRef.current;
        queueFailedRef.current = false;
        queueFailureRef.current = null;
        refreshQueuedRef.current = false;

        let reconciled = true;
        if (shouldReconcile) {
          reconciled = await refresh();
        } else if (savedSnapshot) {
          snapshotRef.current = savedSnapshot;
          setSnapshot(savedSnapshot);
        }

        if (failure) {
          setSaveState("error");
          setSaveError({ error: failure, reconciled });
        } else {
          setSaveState("idle");
        }
      });
    },
    [gameCode, refresh],
  );

  const recoverSave = useCallback(async () => {
    const reconciled = await refresh();
    if (reconciled) {
      setSaveState("idle");
      setSaveError(null);
    } else {
      setSaveError((current) =>
        current ? { ...current, reconciled: false } : current,
      );
    }
  }, [refresh]);

  const dismissSaveError = useCallback(() => {
    setSaveState("idle");
    setSaveError(null);
  }, []);

  return {
    snapshot,
    refresh,
    refreshError,
    isRefreshing: refreshStatus === "refreshing",
    saveState,
    saveError,
    commit,
    recoverSave,
    dismissSaveError,
  };
}
