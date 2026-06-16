import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getDefaultAlignment,
  getEditionRoles,
  roleById,
  type EditionId,
  type Phase,
} from "@/lib/game-data";
import type {
  Alignment,
  Game,
  GameToken,
  PlayerSnapshot,
  Seat,
  StorytellerSnapshot,
} from "@/lib/game-data/types";
import { createJoinCode, createSecretToken, hashToken } from "@/lib/server/tokens";

type StoredGame = Game & { storytellerTokenHash: string };
type StoredSeat = Seat & { playerTokenHash: string | null };
type Store = {
  games: Map<string, StoredGame>;
  seats: Map<string, StoredSeat[]>;
  tokens: Map<string, GameToken[]>;
};

type SupabaseGameRow = {
  id: string;
  join_code: string;
  edition: EditionId;
  status: "active" | "archived";
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

type GamePatch = {
  phase?: Phase;
  dayNumber?: number;
  status?: "active" | "archived";
  seats?: Seat[];
  gameTokens?: GameToken[];
};

declare global {
  var __botcStore: Store | undefined;
}

const memoryStore =
  globalThis.__botcStore ??
  (globalThis.__botcStore = {
    games: new Map<string, StoredGame>(),
    seats: new Map<string, StoredSeat[]>(),
    tokens: new Map<string, GameToken[]>(),
  });

function publicGame(game: StoredGame): Game {
  return {
    id: game.id,
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
    gameId: seat.gameId,
    seatIndex: seat.seatIndex,
    playerName: seat.playerName,
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

function rowToToken(row: SupabaseTokenRow): GameToken {
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

function tokenToRow(token: GameToken): SupabaseTokenRow {
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

function createStarterSeats(gameId: string, edition: EditionId) {
  const now = new Date().toISOString();
  const starterRoles = getEditionRoles(edition).filter(
    (role) => role.team !== "traveller",
  );

  return Array.from({ length: 7 }, (_, index): StoredSeat => {
    const role = starterRoles[index] ?? null;

    return {
      id: crypto.randomUUID(),
      gameId,
      seatIndex: index,
      playerName: `Player ${index + 1}`,
      playerTokenHash: null,
      roleId: role?.id ?? null,
      alignment: role ? getDefaultAlignment(role) : "good",
      alive: true,
      ghostVoteAvailable: true,
      isTraveller: false,
      joinedAt: now,
    };
  });
}

export async function createGame(edition: EditionId) {
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
  const seats = createStarterSeats(gameId, edition);

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
  const normalizedCode = joinCode.trim().toUpperCase();
  const playerToken = createSecretToken("pl");

  if (supabase) {
    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("join_code", normalizedCode)
      .single<SupabaseGameRow>();
    if (gameError) throw gameError;

    const game = rowToGame(gameRow);
    const { data: existingRows, error: seatsError } = await supabase
      .from("seats")
      .select("*")
      .eq("game_id", game.id)
      .order("seat_index", { ascending: true })
      .returns<SupabaseSeatRow[]>();
    if (seatsError) throw seatsError;

    const existing = existingRows.map(rowToSeat);
    const openSeat = existing.find((seat) => !seat.playerTokenHash);
    const seat: StoredSeat =
      openSeat ??
      ({
        id: crypto.randomUUID(),
        gameId: game.id,
        seatIndex: existing.length,
        playerName,
        playerTokenHash: hashToken(playerToken),
        roleId: null,
        alignment: "good",
        alive: true,
        ghostVoteAvailable: true,
        isTraveller: false,
        joinedAt: new Date().toISOString(),
      } satisfies StoredSeat);

    seat.playerName = playerName.trim();
    seat.playerTokenHash = hashToken(playerToken);

    const { error: upsertError } = await supabase
      .from("seats")
      .upsert(seatToRow(seat));
    if (upsertError) throw upsertError;

    game.version += 1;
    game.updatedAt = new Date().toISOString();
    const { error: updateGameError } = await supabase
      .from("games")
      .update({ version: game.version, updated_at: game.updatedAt })
      .eq("id", game.id);
    if (updateGameError) throw updateGameError;

    return {
      playerToken,
      seatId: seat.id,
      snapshot: {
        game: publicGame(game),
        seat: publicSeat(seat),
      } satisfies PlayerSnapshot,
    };
  }

  const game = [...memoryStore.games.values()].find(
    (candidate) => candidate.joinCode === normalizedCode,
  );
  if (!game) throw new Error("No active game uses that join code.");

  const seats = memoryStore.seats.get(game.id) ?? [];
  const openSeat = seats.find((seat) => !seat.playerTokenHash);
  const seat =
    openSeat ??
    ({
      id: crypto.randomUUID(),
      gameId: game.id,
      seatIndex: seats.length,
      playerName,
      playerTokenHash: null,
      roleId: null,
      alignment: "good",
      alive: true,
      ghostVoteAvailable: true,
      isTraveller: false,
      joinedAt: new Date().toISOString(),
    } satisfies StoredSeat);

  seat.playerName = playerName.trim();
  seat.playerTokenHash = hashToken(playerToken);
  if (!openSeat) seats.push(seat);
  memoryStore.seats.set(game.id, seats);
  game.version += 1;
  game.updatedAt = new Date().toISOString();

  return {
    playerToken,
    seatId: seat.id,
    snapshot: { game: publicGame(game), seat: publicSeat(seat) },
  };
}

export async function getStorytellerSnapshot(gameId: string, token: string) {
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

    const [{ data: seatRows, error: seatError }, { data: tokenRows, error: tokenError }] =
      await Promise.all([
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
      gameTokens: tokenRows.map(rowToToken),
    } satisfies StorytellerSnapshot;
  }

  const game = memoryStore.games.get(gameId);
  if (!game) throw new Error("Game not found.");
  assertStoryteller(game, token);

  return {
    game: publicGame(game),
    seats: (memoryStore.seats.get(gameId) ?? []).map(publicSeat),
    gameTokens: memoryStore.tokens.get(gameId) ?? [],
  } satisfies StorytellerSnapshot;
}

export async function getPlayerSnapshot(
  gameId: string,
  seatId: string,
  token: string,
) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const [{ data: gameRow, error: gameError }, { data: seatRow, error: seatError }] =
      await Promise.all([
        supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .single<SupabaseGameRow>(),
        supabase
          .from("seats")
          .select("*")
          .eq("id", seatId)
          .eq("game_id", gameId)
          .single<SupabaseSeatRow>(),
      ]);
    if (gameError) throw gameError;
    if (seatError) throw seatError;

    const game = rowToGame(gameRow);
    const seat = rowToSeat(seatRow);
    assertPlayer(seat, token);

    return { game: publicGame(game), seat: publicSeat(seat) } satisfies PlayerSnapshot;
  }

  const game = memoryStore.games.get(gameId);
  const seat = (memoryStore.seats.get(gameId) ?? []).find(
    (candidate) => candidate.id === seatId,
  );
  if (!game || !seat) throw new Error("Game or seat not found.");
  assertPlayer(seat, token);

  return { game: publicGame(game), seat: publicSeat(seat) } satisfies PlayerSnapshot;
}

export async function updateStorytellerGame(
  gameId: string,
  token: string,
  patch: GamePatch,
) {
  const current = await getStorytellerSnapshot(gameId, token);
  const supabase = getSupabaseAdmin();
  const nextUpdatedAt = new Date().toISOString();
  const nextVersion = current.game.version + 1;

  const normalizedSeats = patch.seats?.map((seat, index): Seat => {
    const role = seat.roleId ? roleById.get(seat.roleId) : undefined;

    return {
      ...seat,
      gameId,
      seatIndex: index,
      roleId: role?.id ?? null,
      alignment: role ? seat.alignment : "good",
      playerName: seat.playerName.trim() || `Player ${index + 1}`,
    };
  });

  const normalizedTokens = patch.gameTokens?.map((gameToken, index) => ({
    ...gameToken,
    gameId,
    position: index,
  }));

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

    const nextSeats = normalizedSeats?.map(
      (seat): StoredSeat => ({
        ...seat,
        playerTokenHash: tokenHashes.get(seat.id) ?? null,
      }),
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
      const { error: deleteSeatsError } = await supabase
        .from("seats")
        .delete()
        .eq("game_id", gameId);
      if (deleteSeatsError) throw deleteSeatsError;
      const { error: insertSeatsError } = await supabase
        .from("seats")
        .insert(nextSeats.map(seatToRow));
      if (insertSeatsError) throw insertSeatsError;
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
        normalizedSeats.map((seat): StoredSeat => ({
          ...seat,
          playerTokenHash: tokenHashes.get(seat.id) ?? null,
        })),
      );
    }

    if (normalizedTokens) {
      memoryStore.tokens.set(gameId, normalizedTokens);
    }
  }

  return getStorytellerSnapshot(gameId, token);
}
