"use client";

import { PageError } from "@/components/ui/page-error";
import { useTransition } from "react";

export default function ApplicationError({ reset }: { reset: () => void }) {
  const [retryPending, startRetry] = useTransition();

  return (
    <PageError
      title="Something went wrong"
      message="The application couldn’t complete this request."
      retryPending={retryPending}
      onRetry={() => startRetry(reset)}
    />
  );
}
