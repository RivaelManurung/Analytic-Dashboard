import { describe, expect, test } from "vitest"

import {
  generateAudience,
  generateChannelBreakdown,
  generateContentPerformance,
  generateCountryStats,
  generateFunnel,
  generateMetricSummary,
  generatePosts,
  generateTimeseries,
} from "@/lib/data/generator"
import { resolveRange } from "@/lib/date-range"
import { analyticsQuerySchema } from "@/lib/schemas/analytics"

const TODAY = new Date(2026, 6, 23)
const SEED = 20260101

const rangeFor = (period: "7d" | "30d" | "90d" | "12m" = "30d") =>
  resolveRange(analyticsQuerySchema.parse({ period }), TODAY)

describe("determinism", () => {
  // The whole point of a seeded generator: the same request must produce the
  // same numbers, or snapshots and E2E assertions cannot be stable.
  test("returns identical series for the same seed and range", () => {
    const a = generateTimeseries("followers", rangeFor(), SEED)
    const b = generateTimeseries("followers", rangeFor(), SEED)

    expect(a).toEqual(b)
  })

  test("returns different series for a different seed", () => {
    const a = generateTimeseries("followers", rangeFor(), SEED)
    const b = generateTimeseries("followers", rangeFor(), SEED + 1)

    expect(a.points.map((p) => p.value)).not.toEqual(b.points.map((p) => p.value))
  })

  test("returns different series for a different range", () => {
    const a = generateTimeseries("followers", rangeFor("7d"), SEED)
    const b = generateTimeseries("followers", rangeFor("90d"), SEED)

    expect(a.points.length).not.toBe(b.points.length)
  })
})

describe("generateTimeseries", () => {
  test("emits one point per day for a 30-day window", () => {
    expect(generateTimeseries("likes", rangeFor("30d"), SEED).points).toHaveLength(30)
  })

  test("buckets a 12-month window into months rather than 365 daily points", () => {
    const series = generateTimeseries("likes", rangeFor("12m"), SEED)

    expect(series.points.length).toBeLessThanOrEqual(13)
    expect(series.points.length).toBeGreaterThan(10)
  })

  test("never produces a negative count", () => {
    for (const key of ["likes", "impressions", "posts", "replies"] as const) {
      const series = generateTimeseries(key, rangeFor("90d"), SEED)
      expect(series.points.every((point) => point.value >= 0)).toBe(true)
    }
  })

  test("keeps a rate metric inside a believable band", () => {
    const series = generateTimeseries("engagementRate", rangeFor("90d"), SEED)

    // Clamped in the generator — noise must not push a ratio above 35%.
    expect(series.points.every((p) => p.value > 0 && p.value <= 0.35)).toBe(true)
  })

  test("carries the metric's fixed palette slot", () => {
    expect(generateTimeseries("followers", rangeFor(), SEED).colorSlot).toBe(1)
  })
})

describe("generateMetricSummary", () => {
  test("aggregates a flow metric by summing its buckets", () => {
    const range = rangeFor("30d")
    const summary = generateMetricSummary("likes", range, SEED)
    const series = generateTimeseries("likes", range, SEED)
    const total = series.points.reduce((sum, point) => sum + point.value, 0)

    expect(summary.value).toBe(total)
  })

  test("aggregates a stock metric by taking its latest reading, not a sum", () => {
    // Summing a daily follower total across 30 days would report ~30x the
    // real audience. This is the bug the stock/flow split exists to prevent.
    const range = rangeFor("30d")
    const summary = generateMetricSummary("followers", range, SEED)
    const series = generateTimeseries("followers", range, SEED)

    expect(summary.value).toBe(series.points.at(-1)!.value)
  })

  test("averages a rate metric rather than summing it", () => {
    const range = rangeFor("30d")
    const summary = generateMetricSummary("engagementRate", range, SEED)

    expect(summary.value).toBeLessThan(1)
  })

  test("computes deltaPercent against the previous window", () => {
    const summary = generateMetricSummary("likes", rangeFor("30d"), SEED)
    const expected = ((summary.value - summary.previousValue) / summary.previousValue) * 100

    expect(summary.deltaPercent).toBeCloseTo(expected, 6)
    expect(summary.delta).toBeCloseTo(summary.value - summary.previousValue, 6)
  })

  test("exposes a sparkline with a point per bucket", () => {
    const summary = generateMetricSummary("likes", rangeFor("30d"), SEED)
    expect(summary.sparkline).toHaveLength(30)
  })
})

describe("generateFunnel", () => {
  const funnel = generateFunnel(rangeFor(), SEED)

  test("is monotonically non-increasing, so it can never widen downward", () => {
    for (let i = 1; i < funnel.length; i += 1) {
      expect(funnel[i]!.value).toBeLessThanOrEqual(funnel[i - 1]!.value)
    }
  })

  test("starts at 100% of itself", () => {
    expect(funnel[0]!.conversionFromTop).toBe(1)
    expect(funnel[0]!.conversionFromPrevious).toBe(1)
  })

  test("keeps every conversion rate inside 0–1", () => {
    for (const stage of funnel) {
      expect(stage.conversionFromPrevious).toBeGreaterThanOrEqual(0)
      expect(stage.conversionFromPrevious).toBeLessThanOrEqual(1)
      expect(stage.conversionFromTop).toBeGreaterThanOrEqual(0)
      expect(stage.conversionFromTop).toBeLessThanOrEqual(1)
    }
  })
})

describe("breakdowns", () => {
  test.each([
    ["channels", generateChannelBreakdown(rangeFor(), SEED)],
    ["content", generateContentPerformance(rangeFor(), SEED)],
  ])("%s shares sum to 1", (_name, items) => {
    const total = items.reduce((sum, item) => sum + item.share, 0)
    expect(total).toBeCloseTo(1, 6)
  })

  test("country shares sum to 1", () => {
    const total = generateCountryStats(rangeFor(), SEED).reduce((sum, c) => sum + c.share, 0)
    expect(total).toBeCloseTo(1, 6)
  })

  test("returns breakdowns sorted by value, descending", () => {
    const items = generateChannelBreakdown(rangeFor(), SEED)
    const sorted = [...items].sort((a, b) => b.value - a.value)

    expect(items).toEqual(sorted)
  })

  test("assigns every item a palette slot within the validated 1–8 range", () => {
    for (const item of generateChannelBreakdown(rangeFor(), SEED)) {
      expect(item.colorSlot).toBeGreaterThanOrEqual(1)
      expect(item.colorSlot).toBeLessThanOrEqual(8)
    }
  })
})

describe("generateAudience", () => {
  const segments = generateAudience(rangeFor(), SEED)

  test("covers every age bracket", () => {
    expect(segments).toHaveLength(6)
    expect(segments[0]!.bucket).toBe("18–24")
  })

  test("never produces a negative segment", () => {
    for (const segment of segments) {
      expect(segment.male).toBeGreaterThanOrEqual(0)
      expect(segment.female).toBeGreaterThanOrEqual(0)
      expect(segment.other).toBeGreaterThanOrEqual(0)
    }
  })
})

describe("generatePosts", () => {
  const posts = generatePosts(rangeFor("30d"), SEED)

  test("generates the requested number of posts", () => {
    expect(posts).toHaveLength(48)
    expect(generatePosts(rangeFor(), SEED, 10)).toHaveLength(10)
  })

  test("gives every post a unique id", () => {
    expect(new Set(posts.map((post) => post.id)).size).toBe(posts.length)
  })

  test("keeps engagement rate plausible, since it is derived from impressions", () => {
    for (const post of posts) {
      expect(post.engagementRate).toBeGreaterThan(0)
      expect(post.engagementRate).toBeLessThan(1)
    }
  })

  test("places every post inside the requested range", () => {
    const range = rangeFor("30d")
    for (const post of posts) {
      expect(post.publishedAt >= range.from).toBe(true)
      expect(post.publishedAt <= range.to).toBe(true)
    }
  })

  test("sorts by impressions, descending", () => {
    const sorted = [...posts].sort((a, b) => b.impressions - a.impressions)
    expect(posts).toEqual(sorted)
  })
})
