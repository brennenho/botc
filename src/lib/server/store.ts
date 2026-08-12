import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeUpdatedSeats } from "@/lib/server/seat-normalization";
import { normalizeGameCode } from "@/lib/game-code";
import type {
  Alignment,
  EditionId,
  Game,
  GameStatus,
  GameToken,
  Phase,
  PlayerSnapshot,
  Seat,
  StorytellerPatch,
  StorytellerSnapshot,
} from "@/lib/game-data/types";
import {
  createJoinCode,
  createSecretToken,
  hashToken,
} from "@/lib/server/tokens";
import { createPlayerSeatViews } from "@/lib/player-seat-view";

type StoredGame = Game & { id: string; storytellerTokenHash: string };
type StoredSeat = Omit<Seat, "claimedByPlayer"> & {
  gameId: string;
  playerTokenHash: string | null;
};
type StoredGameToken = GameToken & { gameId: string };
type Store = {
  games: Map<string, StoredGame>;
  seats: Map<string, StoredSeat[]>;
  tokens: Map<string, StoredGameToken[]>;
};

type SupabaseGameRow = {
  id: string;
  join_code: string;
  edition: EditionId;
  status: GameStatus;
  phase: Phase;
  day_number: number;
  version: number;
  storyteller_token_hash: string;
  created_at: string;
  updated_at: string;
};

type SupabaseSeatRow = {
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

type SupabaseTokenRow = {
  id: string;
  game_id: string;
  seat_id: string | null;
  token_type: GameToken["tokenType"];
  role_id: string | null;
  label: string;
  position: number;
  metadata: Record<string, unknown>;
};

declare global {
  var __botcStore: Store | undefined;
}

const memoryStore =
  globalThis.__botcStore ??
  (globalThis.__botcStore = {
    games: new Map<string, StoredGame>(),
    seats: new Map<string, StoredSeat[]>(),
    tokens: new Map<string, StoredGameToken[]>(),
  });

function createStoredSeat(
  gameId: string,
  seatIndex: number,
  playerName: string,
  playerTokenHash: string | null,
  joinedAt = new Date().toISOString(),
): StoredSeat {
  return {
    id: crypto.randomUUID(),
    gameId,
    seatIndex,
    playerName: playerName.trim(),
    playerTokenHash,
    roleId: null,
    alignment: "good",
    alive: true,
    ghostVoteAvailable: true,
    isTraveller: false,
    joinedAt,
  };
}

function publicGame(game: StoredGame): Game {
  return {
    joinCode: game.joinCode,
    edition: game.edition,
    status: game.status,
    phase: game.phase,
    dayNumber: game.dayNumber,
    version: game.version,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}

function publicSeat(seat: StoredSeat): Seat {
  return {
    id: seat.id,
    seatIndex: seat.seatIndex,
    playerName: seat.playerName,
    claimedByPlayer: Boolean(seat.playerTokenHash),
    roleId: seat.roleId,
    alignment: seat.alignment,
    alive: seat.alive,
    ghostVoteAvailable: seat.ghostVoteAvailable,
    isTraveller: seat.isTraveller,
    joinedAt: seat.joinedAt,
  };
}

function storedSeatFromPublic(
  seat: Seat,
  gameId: string,
  playerTokenHash: string | null,
): StoredSeat {
  return {
    id: seat.id,
    gameId,
    seatIndex: seat.seatIndex,
    playerName: seat.playerName,
    playerTokenHash,
    roleId: seat.roleId,
    alignment: seat.alignment,
    alive: seat.alive,
    ghostVoteAvailable: seat.ghostVoteAvailable,
    isTraveller: seat.isTraveller,
    joinedAt: seat.joinedAt,
  };
}

function rowToGame(row: SupabaseGameRow): StoredGame {
  return {
    id: row.id,
    joinCode: row.join_code,
    edition: row.edition,
    status: row.status,
    phase: row.phase,
    dayNumber: row.day_number,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storytellerTokenHash: row.storyteller_token_hash,
  };
}

function rowToSeat(row: SupabaseSeatRow): StoredSeat {
  return {
    id: row.id,
    gameId: row.game_id,
    seatIndex: row.seat_index,
    playerName: row.player_name,
    playerTokenHash: row.player_token_hash,
    roleId: row.role_id,
    alignment: row.alignment,
    alive: row.alive,
    ghostVoteAvailable: row.ghost_vote_available,
    isTraveller: row.is_traveller,
    joinedAt: row.joined_at,
  };
}

function rowToToken(row: SupabaseTokenRow): StoredGameToken {
  return {
    id: row.id,
    gameId: row.game_id,
    seatId: row.seat_id,
    tokenType: row.token_type,
    roleId: row.role_id,
    label: row.label,
    position: row.position,
    metadata: row.metadata ?? {},
  };
}

function publicToken(token: StoredGameToken): GameToken {
  return {
    id: token.id,
    seatId: token.seatId,
    tokenType: token.tokenType,
    roleId: token.roleId,
    label: token.label,
    position: token.position,
    metadata: token.metadata,
  };
}

function seatToRow(seat: StoredSeat): SupabaseSeatRow {
  return {
    id: seat.id,
    game_id: seat.gameId,
    seat_index: seat.seatIndex,
    player_name: seat.playerName,
    player_token_hash: seat.playerTokenHash,
    role_id: seat.roleId,
    alignment: seat.alignment,
    alive: seat.alive,
    ghost_vote_available: seat.ghostVoteAvailable,
    is_traveller: seat.isTraveller,
    joined_at: seat.joinedAt,
  };
}

function tokenToRow(token: StoredGameToken): SupabaseTokenRow {
  return {
    id: token.id,
    game_id: token.gameId,
    seat_id: token.seatId,
    token_type: token.tokenType,
    role_id: token.roleId,
    label: token.label,
    position: token.position,
    metadata: token.metadata,
  };
}

function assertStoryteller(game: StoredGame, token: string) {
  if (game.storytellerTokenHash !== hashToken(token)) {
    throw new Error("Storyteller token is invalid.");
  }
}

function assertPlayer(seat: StoredSeat, token: string) {
  if (!seat.playerTokenHash || seat.playerTokenHash !== hashToken(token)) {
    throw new Error("Player token is invalid.");
  }
}

async function getGameIdByCode(gameCode: string) {
  const normalizedCode = normalizeGameCode(gameCode);
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data: game, error } = await supabase
      .from("games")
      .select("id")
      .eq("join_code", normalizedCode)
      .maybeSingle<{ id: string }>();
    if (error) throw error;
    return game?.id ?? null;
  }

  return (
    [...memoryStore.games.values()].find(
      (game) => game.joinCode === normalizedCode,
    )?.id ?? null
  );
}

async function requireGameId(gameCode: string) {
  const gameId = await getGameIdByCode(gameCode);
  if (!gameId) throw new Error("Game not found.");
  return gameId;
}

export async function gameExistsByCode(gameCode: string) {
  return (await getGameIdByCode(gameCode)) !== null;
}

export async function createGame(edition: EditionId, playerCount = 7) {
  if (!Number.isInteger(playerCount) || playerCount < 5 || playerCount > 20) {
    throw new Error("Player count must be between 5 and 20.");
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const gameId = crypto.randomUUID();
  const storytellerToken = createSecretToken("st");
  const game: StoredGame = {
    id: gameId,
    joinCode: createJoinCode(),
    edition,
    status: "active",
    phase: "setup",
    dayNumber: 1,
    version: 1,
    createdAt: now,
    updatedAt: now,
    storytellerTokenHash: hashToken(storytellerToken),
  };
  const seats: StoredSeat[] = Array.from(
    { length: playerCount },
    (_, seatIndex) =>
      createStoredSeat(gameId, seatIndex, `Player ${seatIndex + 1}`, null, now),
  );

  if (supabase) {
    const { error: gameError } = await supabase.from("games").insert({
      id: game.id,
      join_code: game.joinCode,
      edition: game.edition,
      status: game.status,
      phase: game.phase,
      day_number: game.dayNumber,
      version: game.version,
      storyteller_token_hash: game.storytellerTokenHash,
      created_at: game.createdAt,
      updated_at: game.updatedAt,
    });
    if (gameError) throw gameError;

    const { error: seatsError } = await supabase
      .from("seats")
      .insert(seats.map(seatToRow));
    if (seatsError) throw seatsError;
  } else {
    memoryStore.games.set(game.id, game);
    memoryStore.seats.set(game.id, seats);
    memoryStore.tokens.set(game.id, []);
  }

  return {
    storytellerToken,
    snapshot: {
      game: publicGame(game),
      seats: seats.map(publicSeat),
      gameTokens: [],
    } satisfies StorytellerSnapshot,
  };
}

export async function joinGame(joinCode: string, playerName: string) {
  const supabase = getSupabaseAdmin();
  const normalizedCode = normalizeGameCode(joinCode);
  const playerToken = createSecretToken("pl");
  const playerTokenHash = hashToken(playerToken);

  if (supabase) {
    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("join_code", normalizedCode)
      .single<SupabaseGameRow>();
    if (gameError) throw gameError;

    const game = rowToGame(gameRow);
    if (game.status !== "active") throw new Error("This game has ended.");

    let seat: StoredSeat | null = null;
    for (let attempt = 0; attempt < 3 && !seat; attempt += 1) {
      const { data: openSeatRow, error: seatError } = await supabase
        .from("seats")
        .select("*")
        .eq("game_id", game.id)
        .is("player_token_hash", null)
        .order("seat_index", { ascending: true })
        .limit(1)
        .maybeSingle<SupabaseSeatRow>();
      if (seatError) throw seatError;
      if (!openSeatRow) throw new Error("This game has no open seats.");

      const { data: claimedSeatRow, error: claimError } = await supabase
        .from("seats")
        .update({
          player_name: playerName.trim(),
          player_token_hash: playerTokenHash,
          joined_at: new Date().toISOString(),
        })
        .eq("id", openSeatRow.id)
        .is("player_token_hash", null)
        .select("*")
        .maybeSingle<SupabaseSeatRow>();
      if (claimError) throw claimError;
      if (claimedSeatRow) seat = rowToSeat(claimedSeatRow);
    }
    if (!seat)
      throw new Error("Unable to claim an open seat. Please try again.");

    game.version += 1;
    game.updatedAt = new Date().toISOString();
    const { error: updateGameError } = await supabase
      .from("games")
      .update({ version: game.version, updated_at: game.updatedAt })
      .eq("id", game.id);
    if (updateGameError) throw updateGameError;

    const snapshot = await getPlayerSnapshot(game.id, seat.id, playerToken);

    return {
      playerToken,
      seatId: seat.id,
      snapshot,
    };
  }

  const game = [...memoryStore.games.values()].find(
    (candidate) => candidate.joinCode === normalizedCode,
  );
  if (!game) throw new Error("No active game uses that join code.");
  if (game.status !== "active") throw new Error("This game has ended.");

  const seats = memoryStore.seats.get(game.id) ?? [];
  const openSeat = seats.find((seat) => !seat.playerTokenHash);
  if (!openSeat) throw new Error("This game has no open seats.");

  const seat = {
    ...openSeat,
    playerName: playerName.trim(),
    playerTokenHash,
    joinedAt: new Date().toISOString(),
  };
  const seatIndex = seats.findIndex((candidate) => candidate.id === seat.id);
  seats[seatIndex] = seat;
  memoryStore.seats.set(game.id, seats);
  game.version += 1;
  game.updatedAt = new Date().toISOString();

  const snapshot = await getPlayerSnapshot(game.id, seat.id, playerToken);

  return {
    playerToken,
    seatId: seat.id,
    snapshot,
  };
}

async function getStorytellerSnapshot(gameId: string, token: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single<SupabaseGameRow>();
    if (gameError) throw gameError;

    const game = rowToGame(gameRow);
    assertStoryteller(game, token);

    const [
      { data: seatRows, error: seatError },
      { data: tokenRows, error: tokenError },
    ] = await Promise.all([
      supabase
        .from("seats")
        .select("*")
        .eq("game_id", gameId)
        .order("seat_index", { ascending: true })
        .returns<SupabaseSeatRow[]>(),
      supabase
        .from("game_tokens")
        .select("*")
        .eq("game_id", gameId)
        .order("position", { ascending: true })
        .returns<SupabaseTokenRow[]>(),
    ]);
    if (seatError) throw seatError;
    if (tokenError) throw tokenError;

    return {
      game: publicGame(game),
      seats: seatRows.map(rowToSeat).map(publicSeat),
      gameTokens: tokenRows.map(rowToToken).map(publicToken),
    } satisfies StorytellerSnapshot;
  }

  const game = memoryStore.games.get(gameId);
  if (!game) throw new Error("Game not found.");
  assertStoryteller(game, token);

  return {
    game: publicGame(game),
    seats: (memoryStore.seats.get(gameId) ?? []).map(publicSeat),
    gameTokens: (memoryStore.tokens.get(gameId) ?? []).map(publicToken),
  } satisfies StorytellerSnapshot;
}

async function getPlayerSnapshot(
  gameId: string,
  seatId: string,
  token: string,
) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const [
      { data: gameRow, error: gameError },
      { data: seatRows, error: seatError },
      { data: tokenRows, error: tokenError },
    ] = await Promise.all([
      supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single<SupabaseGameRow>(),
      supabase
        .from("seats")
        .select("*")
        .eq("game_id", gameId)
        .order("seat_index", { ascending: true })
        .returns<SupabaseSeatRow[]>(),
      supabase
        .from("game_tokens")
        .select("*")
        .eq("game_id", gameId)
        .eq("token_type", "custom")
        .returns<SupabaseTokenRow[]>(),
    ]);
    if (gameError) throw gameError;
    if (seatError) throw seatError;
    if (tokenError) throw tokenError;

    const game = rowToGame(gameRow);
    const storedSeats = seatRows.map(rowToSeat);
    const seat = storedSeats.find((candidate) => candidate.id === seatId);
    if (!seat) throw new Error("Game or seat not found.");
    assertPlayer(seat, token);
    const publicSeats = storedSeats.map(publicSeat);
    const publicTokens = tokenRows.map(rowToToken).map(publicToken);

    return {
      game: publicGame(game),
      seat: publicSeat(seat),
      seats: createPlayerSeatViews(publicSeats, publicTokens),
    } satisfies PlayerSnapshot;
  }

  const game = memoryStore.games.get(gameId);
  const storedSeats = memoryStore.seats.get(gameId) ?? [];
  const seat = storedSeats.find((candidate) => candidate.id === seatId);
  if (!game || !seat) throw new Error("Game or seat not found.");
  assertPlayer(seat, token);

  return {
    game: publicGame(game),
    seat: publicSeat(seat),
    seats: createPlayerSeatViews(
      storedSeats.map(publicSeat),
      (memoryStore.tokens.get(gameId) ?? []).map(publicToken),
    ),
  } satisfies PlayerSnapshot;
}

async function updateStorytellerGame(
  gameId: string,
  token: string,
  patch: StorytellerPatch,
) {
  const current = await getStorytellerSnapshot(gameId, token);
  const supabase = getSupabaseAdmin();
  const nextUpdatedAt = new Date().toISOString();
  const nextVersion = current.game.version + 1;

  const normalizedSeats = patch.seats
    ? normalizeUpdatedSeats(patch.seats)
    : undefined;
  const normalizedTokens = patch.gameTokens?.map(
    (gameToken): StoredGameToken => ({ ...gameToken, gameId }),
  );

  if (supabase) {
    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single<SupabaseGameRow>();
    if (gameError) throw gameError;
    const storedGame = rowToGame(gameRow);
    assertStoryteller(storedGame, token);

    const { data: existingRows, error: existingError } = await supabase
      .from("seats")
      .select("*")
      .eq("game_id", gameId)
      .returns<SupabaseSeatRow[]>();
    if (existingError) throw existingError;

    const tokenHashes = new Map(
      existingRows.map((seatRow) => [seatRow.id, seatRow.player_token_hash]),
    );

    const nextSeats = normalizedSeats?.map((seat) =>
      storedSeatFromPublic(seat, gameId, tokenHashes.get(seat.id) ?? null),
    );

    const { error: updateError } = await supabase
      .from("games")
      .update({
        phase: patch.phase ?? current.game.phase,
        day_number: patch.dayNumber ?? current.game.dayNumber,
        status: patch.status ?? current.game.status,
        version: nextVersion,
        updated_at: nextUpdatedAt,
      })
      .eq("id", gameId);
    if (updateError) throw updateError;

    if (nextSeats) {
      const nextSeatIds = new Set(nextSeats.map((seat) => seat.id));
      const removedSeatIds = existingRows
        .map((seat) => seat.id)
        .filter((seatId) => !nextSeatIds.has(seatId));

      if (removedSeatIds.length > 0) {
        const { error: deleteSeatsError } = await supabase
          .from("seats")
          .delete()
          .in("id", removedSeatIds);
        if (deleteSeatsError) throw deleteSeatsError;
      }

      const { error: upsertSeatsError } = await supabase
        .from("seats")
        .upsert(nextSeats.map(seatToRow));
      if (upsertSeatsError) throw upsertSeatsError;
    }

    if (normalizedTokens) {
      const { error: deleteTokenError } = await supabase
        .from("game_tokens")
        .delete()
        .eq("game_id", gameId);
      if (deleteTokenError) throw deleteTokenError;
      if (normalizedTokens.length > 0) {
        const { error: insertTokenError } = await supabase
          .from("game_tokens")
          .insert(normalizedTokens.map(tokenToRow));
        if (insertTokenError) throw insertTokenError;
      }
    }
  } else {
    const game = memoryStore.games.get(gameId);
    if (!game) throw new Error("Game not found.");
    assertStoryteller(game, token);

    game.phase = patch.phase ?? game.phase;
    game.dayNumber = patch.dayNumber ?? game.dayNumber;
    game.status = patch.status ?? game.status;
    game.version = nextVersion;
    game.updatedAt = nextUpdatedAt;

    if (normalizedSeats) {
      const existing = memoryStore.seats.get(gameId) ?? [];
      const tokenHashes = new Map(
        existing.map((seat) => [seat.id, seat.playerTokenHash]),
      );
      memoryStore.seats.set(
        gameId,
        normalizedSeats.map((seat) =>
          storedSeatFromPublic(seat, gameId, tokenHashes.get(seat.id) ?? null),
        ),
      );
    }

    if (normalizedTokens) {
      memoryStore.tokens.set(gameId, normalizedTokens);
    }
  }

  return getStorytellerSnapshot(gameId, token);
}

export async function getStorytellerSnapshotByCode(
  gameCode: string,
  token: string,
) {
  return getStorytellerSnapshot(await requireGameId(gameCode), token);
}

export async function getPlayerSnapshotByCode(
  gameCode: string,
  seatId: string,
  token: string,
) {
  return getPlayerSnapshot(await requireGameId(gameCode), seatId, token);
}

export async function updateStorytellerGameByCode(
  gameCode: string,
  token: string,
  patch: StorytellerPatch,
) {
  return updateStorytellerGame(await requireGameId(gameCode), token, patch);
}
