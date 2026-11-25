"use client";

import posthog from "posthog-js";

import { env } from "@/env";
import { observabilityEnabled } from "@/lib/observability/config";
import type { ProductEvents } from "@/lib/observability/events";

type ErrorContext = Record<string, string | number | boolean>;
type BoundaryError = Error & { digest?: string };
type InitializationState = "disabled" | "failed" | "ready" | "waiting";

let initializationState: InitializationState = observabilityEnabled
  ? "waiting"
  : "disabled";

export function initializeClientObservability() {
  if (initializationState !== "waiting") return;

  try {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      ui_host: "https://us.posthog.com",
      defaults: "2026-06-25",
      capture_exceptions: true,
      persistence: "localStorage",
      respect_dnt: true,
    });
    initializationState = "ready";
  } catch (error) {
    initializationState = "failed";
    console.error("Unable to initialize client observability.", error);
  }
}

function runWhenReady(action: () => void) {
  if (initializationState === "waiting") initializeClientObservability();
  if (initializationState !== "ready") return;

  try {
    action();
  } catch (error) {
    console.error("Unable to send client observability data.", error);
  }
}

export function trackEvent<Name extends keyof ProductEvents>(
  event: Name,
  properties: ProductEvents[Name],
) {
  runWhenReady(() => posthog.capture(event, properties));
}

export function captureException(error: unknown, context?: ErrorContext) {
  runWhenReady(() => posthog.captureException(error, context));
}

export function captureBoundaryException(
  error: BoundaryError,
  boundary: "application" | "game" | "global",
) {
  // A digest identifies a server-rendering exception. The server instrumentation
  // is the canonical capture point and has the original, unredacted stack.
  if (error.digest) return;
  captureException(error, { error_boundary: boundary });
}
