import type {
  EditionId,
  PlayerSnapshot,
  StorytellerSnapshot,
  VersionedStorytellerPatch,
} from "@/lib/game-data/types";
import {
  AppError,
  isApiErrorPayload,
  type AppErrorCode,
} from "@/lib/app-error";
import { captureException } from "@/lib/observability/client";

function fallbackCodeForStatus(status: number): AppErrorCode {
  if (status === 400) return "invalid_input";
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "unavailable";
  return "unknown";
}

function retryAfterSeconds(response: Response) {
  const value = response.headers.get("Retry-After");
  if (!value) return undefined;
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) ? seconds : undefined;
}

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
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError")
      throw cause;
    throw new AppError(
      "network",
      "Unable to reach the game server. Check your connection and try again.",
      { cause, retryable: true },
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    const error = new AppError(
      "invalid_response",
      response.ok
        ? "The game server returned an invalid response."
        : "The game server could not complete the request.",
      { cause, status: response.status, retryable: true },
    );
    captureException(error, {
      failure: "invalid_json_response",
      method: init?.method ?? "GET",
      source: "api_client",
      status: response.status,
      url,
    });
    throw error;
  }

  if (!response.ok) {
    if (isApiErrorPayload(body)) {
      throw new AppError(body.error.code, body.error.message, {
        id: body.error.id,
        status: response.status,
        retryable: body.error.retryable,
        retryAfterSeconds: retryAfterSeconds(response),
      });
    }

    const error = new AppError(
      fallbackCodeForStatus(response.status),
      "The request could not be completed.",
      {
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
        retryAfterSeconds: retryAfterSeconds(response),
      },
    );
    captureException(error, {
      failure: "unrecognized_error_response",
      method: init?.method ?? "GET",
      source: "api_client",
      status: response.status,
      url,
    });
    throw error;
  }

  return body as T;
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
