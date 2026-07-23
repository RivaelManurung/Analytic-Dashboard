import { afterEach, describe, expect, test, vi } from "vitest"

import { __resetEnvCache, getEnv } from "@/lib/env"

const VALID_SECRET = "a".repeat(48)

afterEach(() => {
  __resetEnvCache()
  vi.unstubAllEnvs()
})

describe("environment validation", () => {
  test("accepts a complete configuration", () => {
    vi.stubEnv("AUTH_SECRET", VALID_SECRET)

    expect(getEnv().AUTH_SECRET).toBe(VALID_SECRET)
  })

  test("applies documented defaults for optional values", () => {
    vi.stubEnv("AUTH_SECRET", VALID_SECRET)

    const env = getEnv()

    expect(env.AUTH_SESSION_MAX_AGE).toBe(86_400)
    expect(env.ANALYTICS_SEED).toBe(20260101)
  })

  // The whole point of deferring validation is that it still happens. If a
  // deployment is genuinely misconfigured it must fail loudly on first use,
  // never fall back to an insecure default.
  test("throws when AUTH_SECRET is absent", () => {
    vi.stubEnv("AUTH_SECRET", undefined)

    expect(() => getEnv()).toThrow(/AUTH_SECRET/)
  })

  test("rejects a secret that is too short to be safe", () => {
    vi.stubEnv("AUTH_SECRET", "too-short")

    expect(() => getEnv()).toThrow(/at least 32 characters/)
  })

  test("names every missing variable in one message", () => {
    vi.stubEnv("AUTH_SECRET", undefined)

    expect(() => getEnv()).toThrow(/Copy .env.example/)
  })

  test("memoises, so validation runs once per process", () => {
    vi.stubEnv("AUTH_SECRET", VALID_SECRET)

    const first = getEnv()
    // A later mutation must not be picked up without an explicit cache reset.
    vi.stubEnv("AUTH_SECRET", "b".repeat(48))

    expect(getEnv()).toBe(first)
  })
})
