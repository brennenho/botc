import type { NightReminderAction } from "@/lib/game-data/night-reminder-actions";

export type EditionId = "tb" | "bmr" | "snv";
export type Team = "townsfolk" | "outsider" | "minion" | "demon" | "traveller";
export type ResidentTeam = Exclude<Team, "traveller">;
export type Alignment = "good" | "evil";
export type Phase = "setup" | "day" | "night" | "finished";
export type GameStatus = "active" | "archived";

export type Role = {
  id: string;
  name: string;
  edition: EditionId;
  team: Team;
  ability: string;
  flavor?: string;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders: string[];
  setup: boolean;
  imagePath: string;
};

export type TeamCounts = Record<ResidentTeam, number>;

export type SetupAssessment = {
  legal: boolean;
  assignedCount: number;
  expected: TeamCounts | null;
  actual: TeamCounts;
  warnings: string[];
};

export type SetupReminderWarning = {
  roleId: string;
  roleName: string;
  missing: { label: string; count: number }[];
};

export type NightOrderEntry = {
  id: string;
  name: string;
  reminder: string;
  reminderActions: NightReminderAction[];
  role: Role | null;
  system: boolean;
};

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

export type StorytellerPatch = {
  phase?: Phase;
  dayNumber?: number;
  status?: GameStatus;
  seats?: Seat[];
  gameTokens?: GameToken[];
};

export type PlayerSnapshot = {
  game: Pick<
    Game,
    "id" | "joinCode" | "edition" | "status" | "phase" | "dayNumber" | "version"
  >;
  seat: Seat;
};
