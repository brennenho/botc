import type { Alignment, EditionId, Phase } from "@/lib/game-data";

export type { Alignment, EditionId, Phase, Role, Team } from "@/lib/game-data";

export type GameStatus = "active" | "archived";

export type Game = {
  id: string;
  joinCode: string;
  edition: EditionId;
  status: GameStatus;
  phase: Phase;
  dayNumber: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type Seat = {
  id: string;
  gameId: string;
  seatIndex: number;
  playerName: string;
  roleId: string | null;
  alignment: Alignment;
  alive: boolean;
  ghostVoteAvailable: boolean;
  isTraveller: boolean;
  joinedAt: string;
};

export type GameToken = {
  id: string;
  gameId: string;
  seatId: string | null;
  tokenType: "reminder" | "bluff" | "custom";
  roleId: string | null;
  label: string;
  position: number;
  metadata: Record<string, unknown>;
};

export type StorytellerSnapshot = {
  game: Game;
  seats: Seat[];
  gameTokens: GameToken[];
};

export type PlayerSnapshot = {
  game: Pick<
    Game,
    "id" | "joinCode" | "edition" | "status" | "phase" | "dayNumber" | "version"
  >;
  seat: Seat;
};
