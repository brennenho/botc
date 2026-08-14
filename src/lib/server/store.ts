import { normalizeGameCode } from "@/lib/game-code";
import { roleById } from "@/lib/game-data";
import type {
  Alignment,
  EditionId,
  Game,
  GameToken,
  Phase,
  PlayerSnapshot,
  Seat,
  StorytellerPatch,
  StorytellerSnapshot,
} from "@/lib/game-data/types";
import { createPlayerSeatViews } from "@/lib/player-seat-view";
import { databaseError, GameStoreError } from "@/lib/server/errors";
import { broadcastGameInvalidation } from "@/lib/server/game-invalidation";
import { normalizeUpdatedSeats } from "@/lib/server/seat-normalization";
import {
  createJoinCode,
  createSecretToken,
  hashToken,
  tokenMatchesHash,
} from "@/lib/server/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type RpcError = {
  code?: string;
  message?: string;
};

type RpcResult = {
  data: unknown;
  error: RpcError | null;
};

type GameRow = {
  id: string;
  join_code: string;
  edition: EditionId;
  phase: Phase;
  day_number: number;
  version: number;
  storyteller_token_hash: string;
  created_at: string;
  updated_at: string;
};

type SeatRow = {
  id: string;
  game_id: string;
  seat_index: number;
  player_name: string;
  player_token_hash: string | null;
  role_id: string | null;
  alignment: Alignment;
  alive: boolean;
  ghost_vote_available: boolean;
  is_traveller: boolean;
  joined_at: string;
};

type TokenRow = {
  id: string;
  game_id: string;
  seat_id: string | null;
  token_type: GameToken["tokenType"];
  role_id: string | null;
  label: string;
  position: number;
  metadata: Record<string, unknown>;
};

type StoredGame = Game & {
  id: string;
  storytellerTokenHash: string;
};

type StoredSeat = Seat & {
  gameId: string;
  playerTokenHash: string | null;
};

export type CreatedGame = {
  credential: string;
  snapshot: StorytellerSnapshot;
};

export type JoinedGame = {
  credential: string;
  seatId: string;
  snapshot: PlayerSnapshot;
};

const gameColumns =
  "id, join_code, edition, phase, day_number, version, storyteller_token_hash, created_at, updated_at";
const seatColumns =
  "id, game_id, seat_index, player_name, player_token_hash, role_id, alignment, alive, ghost_vote_available, is_traveller, joined_at";
const tokenColumns =
  "id, game_id, seat_id, token_type, role_id, label, position, metadata";

function toStoredGame(row: GameRow): StoredGame {
  return {
    id: row.id,
    joinCode: row.join_code,
    edition: row.edition,
    phase: row.phase,
    dayNumber: row.day_number,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storytellerTokenHash: row.storyteller_token_hash,
  };
}

function toStoredSeat(row: SeatRow): StoredSeat {
  return {
    id: row.id,
    gameId: row.game_id,
    seatIndex: row.seat_index,
    playerName: row.player_name,
    claimedByPlayer: Boolean(row.player_token_hash),
    playerTokenHash: row.player_token_hash,
    roleId: row.role_id,
    alignment: row.alignment,
    alive: row.alive,
    ghostVoteAvailable: row.ghost_vote_available,
    isTraveller: row.is_traveller,
    joinedAt: row.joined_at,
  };
}

function toToken(row: TokenRow): GameToken {
  return {
    id: row.id,
    seatId: row.seat_id,
    tokenType: row.token_type,
    roleId: row.role_id,
    label: row.label,
    position: row.position,
    metadata: row.metadata ?? {},
  };
}

function publicGame(game: StoredGame): Game {
  return {
    joinCode: game.joinCode,
    edition: game.edition,
    phase: game.phase,
    dayNumber: game.dayNumber,
    version: game.version,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}

function playerGame(game: StoredGame): PlayerSnapshot["game"] {
  return {
    joinCode: game.joinCode,
    edition: game.edition,
    phase: game.phase,
    dayNumber: game.dayNumber,
    version: game.version,
  };
}

function publicSeat(seat: StoredSeat): Seat {
  return {
    id: seat.id,
    seatIndex: seat.seatIndex,
    playerName: seat.playerName,
    claimedByPlayer: seat.claimedByPlayer,
    roleId: seat.roleId,
    alignment: seat.alignment,
    alive: seat.alive,
    ghostVoteAvailable: seat.ghostVoteAvailable,
    isTraveller: seat.isTraveller,
    joinedAt: seat.joinedAt,
  };
}

function assertCredential(
  tokenHash: string | null,
  credential: string,
  kind: "Player" | "Storyteller",
) {
  if (!credential || !tokenHash || !tokenMatchesHash(credential, tokenHash)) {
    throw new GameStoreError("unauthorized", `${kind} credential is invalid.`);
  }
}

function assertSupportedRoleIds(
  seats: Seat[] | undefined,
  tokens: GameToken[] | undefined,
) {
  const roleIds = [
    ...(seats ?? []).map((seat) => seat.roleId),
    ...(tokens ?? []).map((token) => token.roleId),
  ].filter((roleId): roleId is string => roleId !== null);

  if (roleIds.some((roleId) => !roleById.has(roleId))) {
    throw new GameStoreError(
      "invalid_input",
      "The update contains an unsupported character.",
    );
  }
}

async function findGameByCode(gameCode: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("games")
    .select(gameColumns)
    .eq("join_code", normalizeGameCode(gameCode))
    .maybeSingle<GameRow>();

  if (error) throw databaseError(error);
  return data ? toStoredGame(data) : null;
}

async function requireGameByCode(gameCode: string) {
  const game = await findGameByCode(gameCode);
  if (!game) throw new GameStoreError("not_found", "Game not found.");
  return game;
}

async function loadSeats(gameId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("seats")
    .select(seatColumns)
    .eq("game_id", gameId)
    .order("seat_index", { ascending: true })
    .returns<SeatRow[]>();

  if (error) throw databaseError(error);
  return (data ?? []).map(toStoredSeat);
}

async function loadTokens(gameId: string, tokenType?: GameToken["tokenType"]) {
  let query = getSupabaseAdmin()
    .from("game_tokens")
    .select(tokenColumns)
    .eq("game_id", gameId)
    .order("position", { ascending: true });

  if (tokenType) query = query.eq("token_type", tokenType);

  const { data, error } = await query.returns<TokenRow[]>();
  if (error) throw databaseError(error);
  return (data ?? []).map(toToken);
}

export async function gameExistsByCode(gameCode: string) {
  return (await findGameByCode(gameCode)) !== null;
}

export async function createGame(
  edition: EditionId,
  playerCount = 7,
): Promise<CreatedGame> {
  if (!Number.isInteger(playerCount) || playerCount < 5 || playerCount > 20) {
    throw new GameStoreError(
      "invalid_input",
      "Player count must be between 5 and 20.",
    );
  }

  const supabase = getSupabaseAdmin();
  const credential = createSecretToken("st");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = createJoinCode();
    const { data, error } = (await supabase.rpc("botc_create_game", {
      p_edition: edition,
      p_game_id: crypto.randomUUID(),
      p_join_code: joinCode,
      p_player_count: playerCount,
      p_storyteller_token_hash: hashToken(credential),
    })) as RpcResult;

    if (!error) {
      const result = (
        data as Array<{ game_id: string; game_version: number }> | null
      )?.[0];
      if (!result) {
        throw new GameStoreError("unavailable", "Unable to create game.");
      }

      await broadcastGameInvalidation(joinCode, result.game_version);
      return {
        credential,
        snapshot: await getStorytellerSnapshotByCode(joinCode, credential),
      };
    }

    if (error.code !== "23505") {
      throw databaseError(error, "Unable to create game.");
    }
  }

  throw new GameStoreError(
    "unavailable",
    "Unable to reserve a unique game code. Please try again.",
  );
}

export async function joinGame(
  joinCode: string,
  playerName: string,
): Promise<JoinedGame> {
  const normalizedCode = normalizeGameCode(joinCode);
  const normalizedName = playerName.trim();
  if (!normalizedName || normalizedName.length > 40) {
    throw new GameStoreError(
      "invalid_input",
      "Player name must be between 1 and 40 characters.",
    );
  }

  const credential = createSecretToken("pl");
  const { data, error } = (await getSupabaseAdmin().rpc("botc_join_game", {
    p_join_code: normalizedCode,
    p_player_name: normalizedName,
    p_player_token_hash: hashToken(credential),
  })) as RpcResult;

  if (error) throw databaseError(error, "Unable to join game.");
  const result = (
    data as Array<{
      game_id: string;
      game_version: number;
      seat_id: string;
    }> | null
  )?.[0];
  if (!result) throw new GameStoreError("unavailable", "Unable to join game.");

  await broadcastGameInvalidation(normalizedCode, result.game_version);
  return {
    credential,
    seatId: result.seat_id,
    snapshot: await getPlayerSnapshotByCode(
      normalizedCode,
      result.seat_id,
      credential,
    ),
  };
}

export async function getStorytellerSnapshotByCode(
  gameCode: string,
  credential: string,
): Promise<StorytellerSnapshot> {
  const game = await requireGameByCode(gameCode);
  assertCredential(game.storytellerTokenHash, credential, "Storyteller");
  const [seats, gameTokens] = await Promise.all([
    loadSeats(game.id),
    loadTokens(game.id),
  ]);

  return {
    game: publicGame(game),
    seats: seats.map(publicSeat),
    gameTokens,
  };
}

export async function getPlayerSnapshotByCode(
  gameCode: string,
  seatId: string,
  credential: string,
): Promise<PlayerSnapshot> {
  const game = await requireGameByCode(gameCode);
  const seats = await loadSeats(game.id);
  const seat = seats.find((candidate) => candidate.id === seatId);
  if (!seat) throw new GameStoreError("not_found", "Game or seat not found.");
  assertCredential(seat.playerTokenHash, credential, "Player");

  const positionTokens = await loadTokens(game.id, "custom");
  return {
    game: playerGame(game),
    seat: publicSeat(seat),
    seats: createPlayerSeatViews(seats.map(publicSeat), positionTokens),
  };
}

export async function updateStorytellerGameByCode(
  gameCode: string,
  credential: string,
  expectedVersion: number,
  patch: StorytellerPatch,
) {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw new GameStoreError("invalid_input", "Game version is invalid.");
  }

  assertSupportedRoleIds(patch.seats, patch.gameTokens);
  const seats = patch.seats ? normalizeUpdatedSeats(patch.seats) : undefined;
  const seatPayload = seats?.map((seat) => ({
    id: seat.id,
    seatIndex: seat.seatIndex,
    playerName: seat.playerName,
    roleId: seat.roleId,
    alignment: seat.alignment,
    alive: seat.alive,
    ghostVoteAvailable: seat.ghostVoteAvailable,
    isTraveller: seat.isTraveller,
  }));
  const tokenPayload = patch.gameTokens?.map((token) => ({
    id: token.id,
    seatId: token.seatId,
    tokenType: token.tokenType,
    roleId: token.roleId,
    label: token.label.trim(),
    position: token.position,
    metadata: token.metadata,
  }));
  const normalizedCode = normalizeGameCode(gameCode);
  const { data, error } = (await getSupabaseAdmin().rpc("botc_update_game", {
    p_day_number: patch.dayNumber ?? null,
    p_expected_version: expectedVersion,
    p_game_tokens: tokenPayload ?? null,
    p_join_code: normalizedCode,
    p_phase: patch.phase ?? null,
    p_seats: seatPayload ?? null,
    p_storyteller_token_hash: hashToken(credential),
  })) as RpcResult;

  if (error) throw databaseError(error, "Unable to update game.");
  const result = (
    data as Array<{ game_id: string; game_version: number }> | null
  )?.[0];
  if (!result)
    throw new GameStoreError("unavailable", "Unable to update game.");

  await broadcastGameInvalidation(normalizedCode, result.game_version);
  return getStorytellerSnapshotByCode(normalizedCode, credential);
}
