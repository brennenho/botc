"use client";

import { PageError } from "@/components/ui/page-error";
import { captureBoundaryException } from "@/lib/observability/client";
import { useEffect, useTransition } from "react";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retryPending, startRetry] = useTransition();

  useEffect(() => {
    captureBoundaryException(error, "game");
  }, [error]);

  return (
    <PageError
      title="Couldn’t load the game"
      message="Check your connection and try again."
      retryPending={retryPending}
      onRetry={() => startRetry(reset)}
    />
  );
}
