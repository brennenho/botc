import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getStorytellerSnapshotByCode,
  updateStorytellerGameByCode,
} from "@/lib/server/store";
import { normalizeGameCode } from "@/lib/game-code";

const patchSchema = z.object({
  code: z.string().min(4),
  token: z.string().optional(),
  phase: z.enum(["setup", "day", "night", "finished"]).optional(),
  dayNumber: z.number().int().min(1).optional(),
  status: z.enum(["active", "archived"]).optional(),
  seats: z
    .array(
      z.object({
        id: z.string(),
        seatIndex: z.number().int(),
        playerName: z.string(),
        roleId: z.string().nullable(),
        alignment: z.enum(["good", "evil"]),
        alive: z.boolean(),
        ghostVoteAvailable: z.boolean(),
        isTraveller: z.boolean(),
        joinedAt: z.string(),
      }),
    )
    .optional(),
  gameTokens: z
    .array(
      z.object({
        id: z.string(),
        seatId: z.string().nullable(),
        tokenType: z.enum(["reminder", "bluff", "custom"]),
        roleId: z.string().nullable(),
        label: z.string(),
        position: z.number().int(),
        metadata: z.record(z.unknown()),
      }),
    )
    .optional(),
});

async function getToken(gameCode: string, explicitToken: string | null) {
  if (explicitToken) return explicitToken;
  return (
    (await cookies()).get(`botc_st_${normalizeGameCode(gameCode)}`)?.value ?? ""
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const gameCode = normalizeGameCode(url.searchParams.get("code") ?? "");
    const token = await getToken(gameCode, url.searchParams.get("token"));
    const snapshot = await getStorytellerSnapshotByCode(gameCode, token);

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load storyteller game.",
      },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const input = patchSchema.parse(await request.json());
    const gameCode = normalizeGameCode(input.code);
    const token = await getToken(gameCode, input.token ?? null);
    const snapshot = await updateStorytellerGameByCode(gameCode, token, input);

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update game.",
      },
      { status: 400 },
    );
  }
}
