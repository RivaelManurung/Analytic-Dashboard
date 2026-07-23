import { describe, expect, test } from "vitest"

import { analyticsQuerySchema, metricKeySchema, periodSchema } from "@/lib/schemas/analytics"
import { paginationSchema, MAX_PAGE_SIZE } from "@/lib/schemas/pagination"

describe("analyticsQuerySchema — defaults", () => {
  test("defaults to a 30-day window with no comparison", () => {
    const query = analyticsQuerySchema.parse({})

    expect(query.period).toBe("30d")
    expect(query.compare).toBe(false)
  })

  test("coerces the compare flag from a query-string value", () => {
    expect(analyticsQuerySchema.parse({ compare: "true" }).compare).toBe(true)
  })
})

describe("analyticsQuerySchema — custom range rules", () => {
  test("accepts a custom period with both endpoints", () => {
    const result = analyticsQuerySchema.safeParse({
      period: "custom",
      from: "2026-01-01",
      to: "2026-01-31",
    })

    expect(result.success).toBe(true)
  })

  test("rejects a custom period missing its endpoints", () => {
    // Encoding this in the schema means no route handler has to re-check it.
    const result = analyticsQuerySchema.safeParse({ period: "custom" })

    expect(result.success).toBe(false)
  })

  test("rejects a custom period with only one endpoint", () => {
    expect(analyticsQuerySchema.safeParse({ period: "custom", from: "2026-01-01" }).success).toBe(
      false
    )
  })

  test("rejects an inverted range", () => {
    const result = analyticsQuerySchema.safeParse({
      period: "custom",
      from: "2026-03-31",
      to: "2026-03-01",
    })

    expect(result.success).toBe(false)
  })

  test("accepts a single-day range where from equals to", () => {
    expect(
      analyticsQuerySchema.safeParse({
        period: "custom",
        from: "2026-03-01",
        to: "2026-03-01",
      }).success
    ).toBe(true)
  })
})

describe("analyticsQuerySchema — malformed input", () => {
  test("rejects an unknown period", () => {
    expect(analyticsQuerySchema.safeParse({ period: "forever" }).success).toBe(false)
  })

  test("rejects a date that is not ISO-formatted", () => {
    expect(
      analyticsQuerySchema.safeParse({ period: "custom", from: "01/03/2026", to: "2026-03-31" })
        .success
    ).toBe(false)
  })

  test("rejects a well-formed but impossible calendar date", () => {
    // Shape alone is not enough: 30 February matches the regex.
    expect(
      analyticsQuerySchema.safeParse({ period: "custom", from: "2026-02-30", to: "2026-03-31" })
        .success
    ).toBe(false)
  })

  test("rejects a SQL-injection-shaped string in a date field", () => {
    expect(
      analyticsQuerySchema.safeParse({
        period: "custom",
        from: "2026-01-01'; DROP TABLE users;--",
        to: "2026-01-31",
      }).success
    ).toBe(false)
  })
})

describe("metricKeySchema", () => {
  test("accepts a known metric", () => {
    expect(metricKeySchema.safeParse("followers").success).toBe(true)
  })

  test("rejects an unknown metric, so a bad path segment cannot reach the repository", () => {
    expect(metricKeySchema.safeParse("__proto__").success).toBe(false)
    expect(metricKeySchema.safeParse("revenue_secret").success).toBe(false)
  })
})

describe("periodSchema", () => {
  test("accepts every documented preset", () => {
    for (const period of ["today", "7d", "30d", "90d", "12m", "custom"]) {
      expect(periodSchema.safeParse(period).success).toBe(true)
    }
  })
})

describe("paginationSchema", () => {
  test("defaults to the first page at 25 rows", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 25 })
  })

  test("coerces numeric strings from the query string", () => {
    expect(paginationSchema.parse({ page: "3", limit: "50" })).toEqual({ page: 3, limit: 50 })
  })

  test("caps the page size, so a client cannot request the entire table", () => {
    expect(paginationSchema.safeParse({ limit: MAX_PAGE_SIZE + 1 }).success).toBe(false)
    expect(paginationSchema.safeParse({ limit: 10_000 }).success).toBe(false)
  })

  test("rejects a non-positive page", () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false)
    expect(paginationSchema.safeParse({ page: -1 }).success).toBe(false)
  })

  test("rejects a fractional page", () => {
    expect(paginationSchema.safeParse({ page: 1.5 }).success).toBe(false)
  })
})
