import { z } from "zod";

import { roleById } from "@/lib/game-data";
import { GAME_CODE_PATTERN } from "@/lib/game-code";

const gameCode = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(GAME_CODE_PATTERN, "Enter a valid game code."));

const roleId = z
  .string()
  .trim()
  .refine((value) => roleById.has(value), "Character is not supported.");

const mutableSeat = z
  .object({
    id: z.string().uuid(),
    seatIndex: z.number().int().min(0).max(19),
    playerName: z.string().trim().min(1).max(40),
    claimedByPlayer: z.boolean(),
    roleId: roleId.nullable(),
    alignment: z.enum(["good", "evil"]),
    alive: z.boolean(),
    ghostVoteAvailable: z.boolean(),
    isTraveller: z.boolean(),
    joinedAt: z.string().datetime({ offset: true }),
  })
  .strict();

const mutableToken = z
  .object({
    id: z.string().uuid(),
    seatId: z.string().uuid().nullable(),
    tokenType: z.enum(["reminder", "bluff", "custom"]),
    roleId: roleId.nullable(),
    label: z.string().trim().min(1).max(80),
    position: z.number().int().min(0),
    metadata: z.record(z.unknown()),
  })
  .strict();

export const createGameSchema = z
  .object({
    edition: z.enum(["tb", "bmr", "snv"]),
    playerCount: z.number().int().min(5).max(20).default(7),
  })
  .strict();

export const joinGameSchema = z
  .object({
    joinCode: gameCode,
    playerName: z.string().trim().min(1).max(40),
  })
  .strict();

export const storytellerPatchSchema = z
  .object({
    code: gameCode,
    expectedVersion: z.number().int().positive(),
    phase: z.enum(["setup", "day", "night"]).optional(),
    dayNumber: z.number().int().positive().optional(),
    seats: z.array(mutableSeat).max(20).optional(),
    gameTokens: z.array(mutableToken).max(250).optional(),
  })
  .strict();

export const gameCodeSchema = gameCode;
export const seatIdSchema = z.string().uuid();

export type MutableSeatInput = z.infer<typeof mutableSeat>;
export type MutableTokenInput = z.infer<typeof mutableToken>;
