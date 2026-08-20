"use client";

import { PageError } from "@/components/ui/page-error";
import { captureBoundaryException } from "@/lib/observability/client";
import { useEffect, useTransition } from "react";

export default function ApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retryPending, startRetry] = useTransition();

  useEffect(() => {
    captureBoundaryException(error, "application");
  }, [error]);

  return (
    <PageError
      title="Something went wrong"
      message="The application couldn’t complete this request."
      retryPending={retryPending}
      onRetry={() => startRetry(reset)}
    />
  );
}
