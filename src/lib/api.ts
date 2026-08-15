import type {
  EditionId,
  PlayerSnapshot,
  StorytellerSnapshot,
  VersionedStorytellerPatch,
} from "@/lib/game-data/types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      "Unable to reach the game server. Check your connection and try again.",
    );
  }

  let body: T & { error?: string };
  try {
    body = (await response.json()) as T & { error?: string };
  } catch {
    throw new Error(
      response.ok
        ? "The game server returned an invalid response."
        : "The game server could not complete the request.",
    );
  }

  if (!response.ok) {
    throw new Error(body.error ?? "The request could not be completed.");
  }

  return body;
}

export function createGame(edition: EditionId, playerCount: number) {
  return requestJson<{
    snapshot: StorytellerSnapshot;
  }>("/api/games", {
    method: "POST",
    body: JSON.stringify({ edition, playerCount }),
  });
}

export function joinGame(joinCode: string, playerName: string) {
  return requestJson<{
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
  patch: VersionedStorytellerPatch,
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
