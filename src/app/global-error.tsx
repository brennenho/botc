"use client";

import { PageError } from "@/components/ui/page-error";
import { captureBoundaryException } from "@/lib/observability/client";
import { useEffect, useTransition } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retryPending, startRetry] = useTransition();

  useEffect(() => {
    captureBoundaryException(error, "global");
  }, [error]);

  return (
    <html lang="en">
      <body>
        <PageError
          title="Something went wrong"
          message="Reload the application to continue."
          retryPending={retryPending}
          onRetry={() => startRetry(reset)}
        />
      </body>
    </html>
  );
}
