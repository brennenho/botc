import type {
  EditionId,
  PlayerSnapshot,
  StorytellerPatch,
  StorytellerSnapshot,
} from "@/lib/game-data/types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "The request could not be completed.");
  }

  return body;
}

export function createGame(edition: EditionId, playerCount: number) {
  return requestJson<{
    storytellerToken: string;
    snapshot: StorytellerSnapshot;
  }>("/api/games", {
    method: "POST",
    body: JSON.stringify({ edition, playerCount }),
  });
}

export function joinGame(joinCode: string, playerName: string) {
  return requestJson<{
    playerToken: string;
    seatId: string;
    snapshot: PlayerSnapshot;
  }>("/api/join", {
    method: "POST",
    body: JSON.stringify({ joinCode, playerName }),
  });
}

export function fetchStorytellerGame(gameCode: string) {
  return requestJson<{ snapshot: StorytellerSnapshot }>(
    `/api/storyteller?code=${encodeURIComponent(gameCode)}`,
  );
}

export function updateStorytellerGame(
  gameCode: string,
  patch: StorytellerPatch,
) {
  return requestJson<{ snapshot: StorytellerSnapshot }>("/api/storyteller", {
    method: "PATCH",
    body: JSON.stringify({ code: gameCode, ...patch }),
  });
}

export function fetchPlayerGame(gameCode: string, seatId: string) {
  return requestJson<{ snapshot: PlayerSnapshot }>(
    `/api/player?code=${encodeURIComponent(gameCode)}&seatId=${encodeURIComponent(seatId)}`,
  );
}
