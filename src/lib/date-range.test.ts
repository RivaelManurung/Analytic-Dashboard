import { describe, expect, test } from "vitest"

import { inferGranularity, resolveRange, toIsoDate, formatBucketLabel } from "@/lib/date-range"
import { analyticsQuerySchema } from "@/lib/schemas/analytics"

// Fixed reference date, so these assertions do not rot as real time passes.
const TODAY = new Date(2026, 6, 23) // 23 July 2026

const query = (input: Record<string, unknown>) => analyticsQuerySchema.parse(input)

describe("inferGranularity", () => {
  test("uses daily buckets for a month or less", () => {
    expect(inferGranularity(7)).toBe("day")
    expect(inferGranularity(31)).toBe("day")
  })

  test("switches to weekly past a month", () => {
    expect(inferGranularity(32)).toBe("week")
    expect(inferGranularity(90)).toBe("week")
  })

  test("switches to monthly past four months, so a year stays readable", () => {
    expect(inferGranularity(121)).toBe("month")
    expect(inferGranularity(365)).toBe("month")
  })
})

describe("resolveRange — presets", () => {
  test("resolves a 7-day window inclusive of today", () => {
    const range = resolveRange(query({ period: "7d" }), TODAY)

    expect(range.to).toBe("2026-07-23")
    expect(range.from).toBe("2026-07-17")
    // Inclusive on both ends: 17th through 23rd is seven days, not six.
    expect(range.days).toBe(7)
  })

  test("resolves `today` as a single day", () => {
    const range = resolveRange(query({ period: "today" }), TODAY)

    expect(range.from).toBe("2026-07-23")
    expect(range.to).toBe("2026-07-23")
    expect(range.days).toBe(1)
  })

  test("defaults to a 30-day window", () => {
    expect(resolveRange(query({}), TODAY).days).toBe(30)
  })
})

describe("resolveRange — comparison window", () => {
  test("places the previous window immediately before, with the same length", () => {
    const range = resolveRange(query({ period: "7d" }), TODAY)

    // The previous window must end the day before `from`, with no gap and no
    // overlap — otherwise the comparison double-counts or skips a day.
    expect(range.previous.to).toBe("2026-07-16")
    expect(range.previous.from).toBe("2026-07-10")
  })

  test("keeps the comparison window the same length as the current one", () => {
    for (const period of ["today", "7d", "30d", "90d"] as const) {
      const range = resolveRange(query({ period }), TODAY)
      const from = new Date(range.previous.from)
      const to = new Date(range.previous.to)
      const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1

      expect(days).toBe(range.days)
    }
  })
})

describe("resolveRange — custom range", () => {
  test("honours explicit endpoints", () => {
    const range = resolveRange(
      query({ period: "custom", from: "2026-03-01", to: "2026-03-31" }),
      TODAY
    )

    expect(range.from).toBe("2026-03-01")
    expect(range.to).toBe("2026-03-31")
    expect(range.days).toBe(31)
  })

  test("counts a single-day custom range as one day, not zero", () => {
    const range = resolveRange(
      query({ period: "custom", from: "2026-03-01", to: "2026-03-01" }),
      TODAY
    )

    expect(range.days).toBe(1)
  })

  test("respects an explicitly requested granularity over the inferred one", () => {
    const range = resolveRange(
      query({ period: "custom", from: "2026-01-01", to: "2026-12-31", granularity: "day" }),
      TODAY
    )

    expect(range.granularity).toBe("day")
  })
})

describe("toIsoDate", () => {
  test("formats without shifting the day across a timezone boundary", () => {
    // Late-evening local time is where a naive toISOString() rolls to tomorrow.
    expect(toIsoDate(new Date(2026, 6, 23, 23, 30))).toBe("2026-07-23")
  })
})

describe("formatBucketLabel", () => {
  test("labels daily and weekly buckets with a day and month", () => {
    const date = new Date(2026, 6, 23)
    expect(formatBucketLabel(date, "day")).toBe("23 Jul")
    expect(formatBucketLabel(date, "week")).toBe("23 Jul")
  })

  test("labels monthly buckets with the year, so a 12-month view is unambiguous", () => {
    expect(formatBucketLabel(new Date(2026, 6, 23), "month")).toBe("Jul 2026")
  })
})
