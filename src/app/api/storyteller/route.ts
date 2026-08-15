import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { storytellerCookieName } from "@/lib/server/auth-cookies";
import {
  gameRouteError,
  privateResponseHeaders,
} from "@/lib/server/route-errors";
import {
  getStorytellerSnapshotByCode,
  updateStorytellerGameByCode,
} from "@/lib/server/store";
import {
  gameCodeSchema,
  storytellerPatchSchema,
} from "@/lib/server/validation";

async function getCredential(gameCode: string) {
  return (await cookies()).get(storytellerCookieName(gameCode))?.value ?? "";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const gameCode = gameCodeSchema.parse(url.searchParams.get("code") ?? "");
    const snapshot = await getStorytellerSnapshotByCode(
      gameCode,
      await getCredential(gameCode),
    );

    return NextResponse.json({ snapshot }, { headers: privateResponseHeaders });
  } catch (error) {
    return gameRouteError(error, "Unable to load storyteller game.");
  }
}

export async function PATCH(request: Request) {
  try {
    const input = storytellerPatchSchema.parse(await request.json());
    const { code, expectedVersion, ...patch } = input;
    const snapshot = await updateStorytellerGameByCode(
      code,
      await getCredential(code),
      expectedVersion,
      patch,
    );

    return NextResponse.json({ snapshot }, { headers: privateResponseHeaders });
  } catch (error) {
    return gameRouteError(error, "Unable to update game.");
  }
}
