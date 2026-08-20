export const appErrorCodes = [
  "conflict",
  "invalid_input",
  "no_open_seats",
  "not_found",
  "unauthorized",
  "rate_limited",
  "unavailable",
  "network",
  "invalid_response",
  "unknown",
] as const;

export type AppErrorCode = (typeof appErrorCodes)[number];

const appErrorCodeSet: ReadonlySet<string> = new Set(appErrorCodes);

export type ApiErrorPayload = {
  error: {
    code: AppErrorCode;
    id?: string;
    message: string;
    retryable: boolean;
  };
};

type AppErrorOptions = ErrorOptions & {
  id?: string;
  status?: number;
  retryable?: boolean;
  retryAfterSeconds?: number;
};

export class AppError extends Error {
  readonly id?: string;
  readonly status?: number;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;

  constructor(
    readonly code: AppErrorCode,
    message: string,
    options: AppErrorOptions = {},
  ) {
    super(message, options);
    this.name = "AppError";
    this.id = options.id;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!value || typeof value !== "object") return false;
  const error = (value as { error?: unknown }).error;
  if (!error || typeof error !== "object") return false;
  const candidate = error as Record<string, unknown>;

  return (
    typeof candidate.code === "string" &&
    appErrorCodeSet.has(candidate.code) &&
    (candidate.id === undefined || typeof candidate.id === "string") &&
    typeof candidate.message === "string" &&
    typeof candidate.retryable === "boolean"
  );
}

export function toAppError(
  error: unknown,
  fallbackMessage = "The request could not be completed.",
): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError("unknown", fallbackMessage, {
      cause: error,
    });
  }

  return new AppError("unknown", fallbackMessage, { cause: error });
}

export function isTerminalGameError(error: AppError | null) {
  return error?.code === "not_found" || error?.code === "unauthorized";
}
