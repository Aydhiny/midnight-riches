/**
 * Rate limiter — uses Upstash Redis when UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN are set, falls back to an in-process Map
 * (good enough for single-instance dev; not shared across serverless workers).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// ── Upstash path ──────────────────────────────────────────────────────────────

let upstashLimiters: Map<string, Ratelimit> | null = null;

function getUpstashLimiter(key: string, maxRequests: number, windowMs: number): Ratelimit | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  if (!upstashLimiters) upstashLimiters = new Map();

  const cacheKey = `${maxRequests}:${windowMs}`;
  if (!upstashLimiters.has(cacheKey)) {
    const redis = new Redis({ url, token });
    upstashLimiters.set(
      cacheKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
        prefix: "mr:rl",
        analytics: false,
      })
    );
  }
  return upstashLimiters.get(cacheKey)!;
}

// ── In-memory fallback ─────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanupInMemory() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function checkInMemory(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanupInMemory();
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || existing.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (existing.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return {
    success: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

const DEFAULT_MAX    = 60;
const DEFAULT_WINDOW = 60_000;

/**
 * Synchronous check — uses in-memory store only.
 * Kept for callers that haven't migrated to the async version.
 */
export function checkRateLimit(
  identifier: string,
  opts?: { maxRequests?: number; windowMs?: number }
): RateLimitResult {
  const maxRequests = opts?.maxRequests ?? DEFAULT_MAX;
  const windowMs    = opts?.windowMs    ?? DEFAULT_WINDOW;
  return checkInMemory(identifier, maxRequests, windowMs);
}

/**
 * Async check — prefers Upstash Redis (distributed, survives deploys)
 * and falls back to in-memory when Upstash is not configured.
 */
export async function checkRateLimitAsync(
  identifier: string,
  opts?: { maxRequests?: number; windowMs?: number }
): Promise<RateLimitResult> {
  const maxRequests = opts?.maxRequests ?? DEFAULT_MAX;
  const windowMs    = opts?.windowMs    ?? DEFAULT_WINDOW;

  const limiter = getUpstashLimiter(identifier, maxRequests, windowMs);
  if (!limiter) {
    return checkInMemory(identifier, maxRequests, windowMs);
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, resetAt: reset };
  } catch {
    // Redis unavailable — degrade gracefully to in-memory
    return checkInMemory(identifier, maxRequests, windowMs);
  }
}
