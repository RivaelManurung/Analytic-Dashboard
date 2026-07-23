import { afterEach, describe, expect, test, vi } from "vitest"
import { z } from "zod"

import { apiError, apiSuccess, apiUnexpectedError, apiValidationError } from "@/lib/api/response"
import { parseSearchParams } from "@/lib/api/parse-query"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("apiSuccess", () => {
  test("wraps the payload in the success envelope", async () => {
    const response = apiSuccess({ id: 1 })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, data: { id: 1 } })
  })

  test("includes pagination meta when supplied", async () => {
    const response = apiSuccess([1, 2], { meta: { total: 40, page: 1, limit: 2 } })

    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [1, 2],
      meta: { total: 40, page: 1, limit: 2 },
    })
  })

  test("omits meta entirely when not supplied", async () => {
    const body = await apiSuccess({ id: 1 }).json()

    expect(body).not.toHaveProperty("meta")
  })

  test("passes through custom headers", () => {
    const response = apiSuccess({}, { headers: { "RateLimit-Limit": "120" } })

    expect(response.headers.get("RateLimit-Limit")).toBe("120")
  })
})

describe("apiError", () => {
  test.each([
    ["VALIDATION_ERROR", 400],
    ["UNAUTHORIZED", 401],
    ["FORBIDDEN", 403],
    ["NOT_FOUND", 404],
    ["RATE_LIMITED", 429],
    ["INTERNAL_ERROR", 500],
  ] as const)("maps %s to HTTP %i", (code, status) => {
    expect(apiError(code, "message").status).toBe(status)
  })

  test("wraps the message in the error envelope", async () => {
    const body = await apiError("NOT_FOUND", 'Unknown metric "xyz".').json()

    expect(body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: 'Unknown metric "xyz".' },
    })
  })
})

describe("apiValidationError", () => {
  const schema = z.object({
    email: z.string().email(),
    age: z.number().int().min(0),
  })

  test("returns 400 with per-field messages", async () => {
    const result = schema.safeParse({ email: "nope", age: -1 })
    const response = apiValidationError(result.error!)

    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error.fields).toHaveProperty("email")
    expect(body.error.fields).toHaveProperty("age")
  })

  test("keys nested paths with dot notation, so a form can target the field", async () => {
    const nested = z.object({ user: z.object({ email: z.string().email() }) })
    const result = nested.safeParse({ user: { email: "nope" } })
    const body = await apiValidationError(result.error!).json()

    expect(body.error.fields).toHaveProperty("user.email")
  })

  test("groups issues under a _root key when they have no path", async () => {
    const refined = z
      .object({ a: z.number(), b: z.number() })
      .refine((v) => v.a < v.b, "a must be less than b")
    const result = refined.safeParse({ a: 5, b: 1 })
    const body = await apiValidationError(result.error!).json()

    expect(body.error.fields._root).toContain("a must be less than b")
  })
})

describe("apiUnexpectedError", () => {
  test("routes a ZodError to the validation handler", async () => {
    const result = z.object({ a: z.string() }).safeParse({ a: 1 })
    const response = apiUnexpectedError(result.error!)

    expect(response.status).toBe(400)
  })

  test("never leaks the underlying message to the client", async () => {
    // An exception can carry a connection string or a file path; exposing it
    // is an information-disclosure bug.
    vi.spyOn(console, "error").mockImplementation(() => {})

    const secret = "postgres://admin:hunter2@10.0.0.5/prod"
    const response = apiUnexpectedError(new Error(secret))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(JSON.stringify(body)).not.toContain(secret)
    expect(body.error.message).toBe("Something went wrong. Please try again.")
  })

  test("logs the real error server-side for diagnosis", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    apiUnexpectedError(new Error("boom"))

    expect(spy).toHaveBeenCalled()
  })

  test("handles a thrown non-Error value", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    expect(apiUnexpectedError("just a string").status).toBe(500)
  })
})

describe("parseSearchParams", () => {
  test("converts params into a plain object", () => {
    const params = new URLSearchParams("period=7d&compare=true")

    expect(parseSearchParams(params)).toEqual({ period: "7d", compare: "true" })
  })

  test("omits empty values so schema defaults still apply", () => {
    // Setting the key to "" would override a `.default()` with an invalid value.
    const params = new URLSearchParams("period=&compare=true")

    expect(parseSearchParams(params)).toEqual({ compare: "true" })
  })

  test("keeps the first value when a key repeats", () => {
    // `?period=7d&period=90d` would otherwise make the effective filter ambiguous.
    const params = new URLSearchParams("period=7d&period=90d")

    expect(parseSearchParams(params)).toEqual({ period: "7d" })
  })

  test("returns an empty object for an empty query string", () => {
    expect(parseSearchParams(new URLSearchParams(""))).toEqual({})
  })
})
