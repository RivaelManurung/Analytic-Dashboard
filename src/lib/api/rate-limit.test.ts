import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import {
  __resetRateLimitStore,
  checkRateLimit,
  clientKey,
  rateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/api/rate-limit"

beforeEach(() => {
  __resetRateLimitStore()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const options = { limit: 3, windowMs: 60_000 }

describe("checkRateLimit", () => {
  test("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit("user", options).success).toBe(true)
    }
  })

  test("blocks the request after the limit is reached", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("user", options)

    expect(checkRateLimit("user", options).success).toBe(false)
  })

  test("counts down the remaining allowance", () => {
    expect(checkRateLimit("user", options).remaining).toBe(2)
    expect(checkRateLimit("user", options).remaining).toBe(1)
    expect(checkRateLimit("user", options).remaining).toBe(0)
  })

  test("tracks each key independently, so one client cannot block another", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("alice", options)

    expect(checkRateLimit("alice", options).success).toBe(false)
    expect(checkRateLimit("bob", options).success).toBe(true)
  })

  test("resets once the window has elapsed", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("user", options)
    expect(checkRateLimit("user", options).success).toBe(false)

    vi.advanceTimersByTime(60_001)

    expect(checkRateLimit("user", options).success).toBe(true)
  })

  test("does not reset before the window elapses", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("user", options)

    vi.advanceTimersByTime(59_000)

    expect(checkRateLimit("user", options).success).toBe(false)
  })

  test("reports retryAfter only when blocked", () => {
    expect(checkRateLimit("user", options).retryAfter).toBeUndefined()

    checkRateLimit("user", options)
    checkRateLimit("user", options)
    const blocked = checkRateLimit("user", options)

    expect(blocked.success).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
    expect(blocked.retryAfter).toBeLessThanOrEqual(60)
  })
})

describe("RATE_LIMITS presets", () => {
  test("keeps credential endpoints far tighter than reads", () => {
    // Brute-force resistance depends on this gap.
    expect(RATE_LIMITS.auth.limit).toBeLessThan(RATE_LIMITS.read.limit)
    expect(RATE_LIMITS.auth.limit).toBeLessThanOrEqual(5)
  })

  test("throttles exports, which are expensive to generate", () => {
    expect(RATE_LIMITS.export.limit).toBeLessThan(RATE_LIMITS.read.limit)
  })
})

describe("rateLimitHeaders", () => {
  test("emits the standard RateLimit headers", () => {
    const headers = rateLimitHeaders(checkRateLimit("user", options))

    expect(headers["RateLimit-Limit"]).toBe("3")
    expect(headers["RateLimit-Remaining"]).toBe("2")
    expect(headers["RateLimit-Reset"]).toBeDefined()
    expect(headers["Retry-After"]).toBeUndefined()
  })

  test("adds Retry-After once blocked, so a client can back off correctly", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("user", options)
    const headers = rateLimitHeaders(checkRateLimit("user", options))

    expect(headers["Retry-After"]).toBeDefined()
    expect(headers["RateLimit-Remaining"]).toBe("0")
  })
})

describe("clientKey", () => {
  const request = (headers: Record<string, string>) => new Request("http://x", { headers })

  test("uses the first entry of x-forwarded-for", () => {
    // The left-most address is the original client; the rest are proxy hops.
    const key = clientKey(request({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }), "login")

    expect(key).toBe("login:1.2.3.4")
  })

  test("falls back to x-real-ip", () => {
    expect(clientKey(request({ "x-real-ip": "9.9.9.9" }), "login")).toBe("login:9.9.9.9")
  })

  test("falls back to a placeholder when no address header is present", () => {
    expect(clientKey(request({}), "login")).toBe("login:unknown")
  })

  test("namespaces by scope, so limits do not bleed between endpoints", () => {
    const headers = { "x-forwarded-for": "1.2.3.4" }

    expect(clientKey(request(headers), "login")).not.toBe(clientKey(request(headers), "export"))
  })
})
