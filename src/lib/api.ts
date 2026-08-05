import type {
  EditionId,
  GameToken,
  PlayerSnapshot,
  Seat,
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

export function fetchStorytellerGame(gameId: string) {
  return requestJson<{ snapshot: StorytellerSnapshot }>(
    `/api/storyteller?gameId=${encodeURIComponent(gameId)}`,
  );
}

export function updateStorytellerGame(
  gameId: string,
  patch: {
    phase?: StorytellerSnapshot["game"]["phase"];
    dayNumber?: number;
    status?: StorytellerSnapshot["game"]["status"];
    seats?: Seat[];
    gameTokens?: GameToken[];
  },
) {
  return requestJson<{ snapshot: StorytellerSnapshot }>("/api/storyteller", {
    method: "PATCH",
    body: JSON.stringify({ gameId, ...patch }),
  });
}

export function fetchPlayerGame(gameId: string, seatId: string) {
  return requestJson<{ snapshot: PlayerSnapshot }>(
    `/api/player?gameId=${encodeURIComponent(gameId)}&seatId=${encodeURIComponent(seatId)}`,
  );
}
