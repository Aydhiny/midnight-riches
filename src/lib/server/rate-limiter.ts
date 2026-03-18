interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  opts?: { maxRequests?: number; windowMs?: number }
): RateLimitResult {
  const maxRequests = opts?.maxRequests ?? MAX_REQUESTS;
  const windowMs = opts?.windowMs ?? WINDOW_MS;
  const now = Date.now();

  cleanup();

  const existing = store.get(identifier);

  if (!existing || existing.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (existing.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return { success: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
}
