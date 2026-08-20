export type LogContext = Record<string, unknown>;
export type LogAttribute = string | number | boolean;
export type LogAttributes = Record<string, LogAttribute>;

type SerializedValue =
  | null
  | boolean
  | number
  | string
  | SerializedValue[]
  | { [key: string]: SerializedValue };

function serializeValue(
  value: unknown,
  seen: WeakSet<object>,
): SerializedValue {
  if (value === null) return null;

  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }

  if (typeof value === "bigint" || typeof value === "symbol") {
    return String(value);
  }

  if (typeof value === "undefined" || typeof value === "function") {
    return String(value);
  }

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (value instanceof Date) return value.toISOString();
  if (value instanceof URL) return value.toString();
  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, seen));
  }

  const serialized: Record<string, SerializedValue> = {};

  if (value instanceof Error) {
    serialized.name = value.name;
    serialized.message = value.message;
    if (value.stack) serialized.stack = value.stack;
    if (value.cause !== undefined) {
      serialized.cause = serializeValue(value.cause, seen);
    }
  }

  for (const property of Object.getOwnPropertyNames(value)) {
    if (Object.hasOwn(serialized, property) || property === "cause") continue;

    try {
      serialized[property] = serializeValue(
        (value as Record<string, unknown>)[property],
        seen,
      );
    } catch (error) {
      serialized[property] = `[Unable to read property: ${String(error)}]`;
    }
  }

  return serialized;
}

export function serializeLogValue(value: unknown) {
  return serializeValue(value, new WeakSet());
}

export function stringifyLogValue(value: unknown) {
  try {
    return JSON.stringify(serializeLogValue(value));
  } catch (error) {
    return JSON.stringify({ serializationError: String(error) });
  }
}

export function runtimeLogContext(): LogContext {
  return {
    "cloud.region": process.env.VERCEL_REGION,
    "deployment.environment": process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    "deployment.url": process.env.VERCEL_URL,
    "service.name": "botc",
    "service.version": process.env.VERCEL_GIT_COMMIT_SHA,
  };
}

export function requestLogContext(request: Request): LogContext {
  let pathname: string | undefined;
  let query: string | undefined;

  try {
    const url = new URL(request.url);
    pathname = url.pathname;
    query = url.search || undefined;
  } catch {
    // The full URL is still included below if a non-standard Request is supplied.
  }

  return {
    "http.request.method": request.method,
    "url.full": request.url,
    "url.path": pathname,
    "url.query": query,
    "vercel.request_id": request.headers.get("x-vercel-id"),
  };
}

export function normalizeLogContext(context: LogContext): LogAttributes {
  const attributes: LogAttributes = {};

  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) continue;

    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      attributes[key] = value;
      continue;
    }

    attributes[key] =
      typeof value === "number" ? String(value) : stringifyLogValue(value);
  }

  return attributes;
}
