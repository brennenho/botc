import type { AppErrorCode } from "@/lib/app-error";

export type GameStoreErrorCode = Extract<
  AppErrorCode,
  | "conflict"
  | "invalid_input"
  | "no_open_seats"
  | "not_found"
  | "unauthorized"
  | "unavailable"
>;

export class GameStoreError extends Error {
  constructor(
    readonly code: GameStoreErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "GameStoreError";
  }
}

type DatabaseError = {
  code?: string;
  message?: string;
};

const databaseErrorMap: ReadonlyArray<
  readonly [marker: string, code: GameStoreErrorCode, message: string]
> = [
  ["BOTC_GAME_NOT_FOUND", "not_found", "Game not found."],
  ["BOTC_UNAUTHORIZED", "unauthorized", "That game credential is invalid."],
  [
    "BOTC_VERSION_CONFLICT",
    "conflict",
    "The game changed before this update was saved. Refresh and try again.",
  ],
  ["BOTC_NO_OPEN_SEATS", "no_open_seats", "This game has no open seats."],
  [
    "BOTC_FOREIGN_SEAT",
    "invalid_input",
    "A seat does not belong to this game.",
  ],
  [
    "BOTC_FOREIGN_TOKEN",
    "invalid_input",
    "A token does not belong to this game.",
  ],
  [
    "BOTC_FOREIGN_TOKEN_SEAT",
    "invalid_input",
    "A token references a seat outside this game.",
  ],
  ["BOTC_DUPLICATE_SEATS", "invalid_input", "Seat identifiers must be unique."],
  [
    "BOTC_DUPLICATE_TOKENS",
    "invalid_input",
    "Token identifiers must be unique.",
  ],
  ["BOTC_INVALID_", "invalid_input", "The game update is invalid."],
];

export function databaseError(
  error: unknown,
  fallbackMessage = "The game service is unavailable.",
): GameStoreError {
  const value = error as DatabaseError;
  const rawMessage = value.message ?? "";
  const mapped = databaseErrorMap.find(([marker]) =>
    rawMessage.includes(marker),
  );

  if (mapped) {
    return new GameStoreError(mapped[1], mapped[2], { cause: error });
  }

  return new GameStoreError("unavailable", fallbackMessage, { cause: error });
}
