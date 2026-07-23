import "server-only"

/**
 * Fixed-window rate limiter backed by an in-process Map.
 *
 * LIMITATION — read before relying on this in production:
 * the counters live in one Node process, so they are NOT shared across
 * instances and are lost on restart. Behind a load balancer or on serverless
 * this degrades to roughly `limit × instanceCount`. It raises the cost of
 * casual abuse; it is not a defence against a distributed attacker.
 *
 * For real deployments swap the store for Redis (`@upstash/ratelimit`) — the
 * `checkRateLimit` signature is designed to stay the same.
 */

interface Window {
  count: number
  resetAt: number
}

const buckets = new Map<string, Window>()

/** Bounds memory: an attacker rotating IPs must not grow the Map without limit. */
const MAX_TRACKED_KEYS = 10_000

function evictExpired(now: number): void {
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
  /** Seconds until the window resets. Set only when the request was blocked. */
  retryAfter?: number
}

export interface RateLimitOptions {
  /** Requests allowed per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs } = options
  const now = Date.now()

  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) evictExpired(now)

    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { success: true, limit, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    }
  }

  existing.count += 1
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  }
}

/** Standard headers so clients can back off without guessing. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  }
  if (result.retryAfter !== undefined) {
    headers["Retry-After"] = String(result.retryAfter)
  }
  return headers
}

/**
 * Best-effort client identity.
 *
 * `x-forwarded-for` is client-controlled unless a trusted proxy overwrites it,
 * so this is only safe when the app sits behind one (Vercel, Cloudflare, an
 * ingress you own). Direct-to-Node deployments must not trust it.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
  return `${scope}:${ip}`
}

/** Test-only: clears all counters so cases cannot leak into each other. */
export function __resetRateLimitStore(): void {
  buckets.clear()
}

export const RATE_LIMITS = {
  /** Read-heavy analytics endpoints. */
  read: { limit: 120, windowMs: 60_000 },
  /** Credential endpoints, kept deliberately tight to slow brute force. */
  auth: { limit: 5, windowMs: 60_000 },
  /** Exports are expensive to generate. */
  export: { limit: 10, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitOptions>
