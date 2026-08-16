"use client";

import { PageError } from "@/components/ui/page-error";
import { useTransition } from "react";

export default function GameError({ reset }: { reset: () => void }) {
  const [retryPending, startRetry] = useTransition();

  return (
    <PageError
      title="Couldn’t load the game"
      message="Check your connection and try again."
      retryPending={retryPending}
      onRetry={() => startRetry(reset)}
    />
  );
}
