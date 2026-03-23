/**
 * Simple in-memory rate limiter.
 * Uses a sliding-window approach per key (e.g. IP address).
 * NOTE: This is process-local. For multi-instance deployments,
 * replace with Redis-backed rate limiting (e.g. Upstash).
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

const LIMIT = 20; // max requests per window
const WINDOW_MS = 60_000; // 1 minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: LIMIT - 1, resetInMs: WINDOW_MS };
  }

  if (entry.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: LIMIT - entry.count,
    resetInMs: entry.resetAt - now,
  };
}
