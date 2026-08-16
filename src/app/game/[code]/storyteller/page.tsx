import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { StorytellerApp } from "@/components/storyteller/storyteller-app";
import { normalizeGameCode } from "@/lib/game-code";
import { storytellerCookieName } from "@/lib/server/auth-cookies";
import { GameStoreError } from "@/lib/server/errors";
import { getStorytellerSnapshotByCode } from "@/lib/server/store";

export default async function StorytellerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const gameCode = normalizeGameCode(code);
  const credential =
    (await cookies()).get(storytellerCookieName(gameCode))?.value ?? "";

  try {
    const snapshot = await getStorytellerSnapshotByCode(gameCode, credential);
    return <StorytellerApp gameCode={gameCode} initialSnapshot={snapshot} />;
  } catch (error) {
    if (
      error instanceof GameStoreError &&
      (error.code === "not_found" || error.code === "unauthorized")
    ) {
      notFound();
    }

    throw error;
  }
}
