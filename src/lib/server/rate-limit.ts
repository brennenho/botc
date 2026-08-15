type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const MAX_TRACKED_BUCKETS = 10_000;
const globalRateLimits = globalThis as typeof globalThis & {
  botcRateLimitBuckets?: Map<string, RateLimitBucket>;
};
const buckets =
  globalRateLimits.botcRateLimitBuckets ?? new Map<string, RateLimitBucket>();

globalRateLimits.botcRateLimitBuckets = buckets;

export function takeRequestRateLimit(
  request: Request,
  namespace: string,
  options: RateLimitOptions,
  now = Date.now(),
): RateLimitResult {
  return takeRateLimit(`${namespace}:${getClientKey(request)}`, options, now);
}

export function takeRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    pruneBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1_000),
  );
  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const clientAddress =
    nonEmpty(request.headers.get("cf-connecting-ip")) ??
    nonEmpty(request.headers.get("x-real-ip")) ??
    nonEmpty(forwardedFor) ??
    "unknown";

  return clientAddress.slice(0, 128);
}

function pruneBuckets(now: number) {
  if (buckets.size < MAX_TRACKED_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  while (buckets.size >= MAX_TRACKED_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

function nonEmpty(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (trimmed === undefined) return undefined;
  if (trimmed.length === 0) return undefined;
  return trimmed;
}
