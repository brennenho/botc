"use client";

import { PageError } from "@/components/ui/page-error";
import { useTransition } from "react";

export default function GlobalError({ reset }: { reset: () => void }) {
  const [retryPending, startRetry] = useTransition();

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
