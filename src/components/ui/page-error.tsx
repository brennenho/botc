"use client";

import { ArrowLeft, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageError({
  title,
  message,
  onRetry,
  retryPending = false,
  homeLabel = "Back home",
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  retryPending?: boolean;
  homeLabel?: string;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="page-error-state">
      <section
        className="page-error-content"
        aria-labelledby="page-error-title"
      >
        <span className="page-error-icon" aria-hidden="true">
          <TriangleAlert />
        </span>
        <h1 ref={headingRef} id="page-error-title" tabIndex={-1}>
          {title}
        </h1>
        <p>{message}</p>
        <div className="page-error-actions">
          {onRetry ? (
            <Button
              variant="secondary"
              pending={retryPending}
              onClick={onRetry}
            >
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          ) : null}
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "quiet", size: "md" }),
              "page-error-home",
            )}
          >
            <ArrowLeft aria-hidden="true" />
            {homeLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
