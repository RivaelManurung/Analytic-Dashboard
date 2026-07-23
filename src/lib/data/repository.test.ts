import { describe, expect, test } from "vitest"

import { analyticsRepository } from "@/lib/data/repository"
import { analyticsQuerySchema, overviewSchema, metricDetailSchema } from "@/lib/schemas/analytics"
import {
  createRng,
  hashSeed,
  pick,
  randomBetween,
  randomInt,
  randomNormal,
} from "@/lib/data/random"
import {
  METRIC_CATALOG,
  getMetricDefinition,
  OVERVIEW_METRIC_KEYS,
} from "@/lib/data/metric-catalog"

const query = (input: Record<string, unknown> = {}) => analyticsQuerySchema.parse(input)

describe("analyticsRepository.getOverview", () => {
  test("returns a payload matching the published schema", async () => {
    const overview = await analyticsRepository.getOverview(query())

    expect(() => overviewSchema.parse(overview)).not.toThrow()
  })

  test("returns a summary for every headline metric", async () => {
    const overview = await analyticsRepository.getOverview(query())

    expect(overview.summaries.map((s) => s.key)).toEqual([...OVERVIEW_METRIC_KEYS])
  })

  test("returns the same payload for the same query", async () => {
    const [a, b] = await Promise.all([
      analyticsRepository.getOverview(query({ period: "7d" })),
      analyticsRepository.getOverview(query({ period: "7d" })),
    ])

    expect(a).toEqual(b)
  })

  test("respects an explicit custom range", async () => {
    const overview = await analyticsRepository.getOverview(
      query({ period: "custom", from: "2026-01-01", to: "2026-01-31" })
    )

    expect(overview.range.from).toBe("2026-01-01")
    expect(overview.range.to).toBe("2026-01-31")
  })
})

describe("analyticsRepository.getMetricDetail", () => {
  test("returns a payload matching the published schema", async () => {
    const detail = await analyticsRepository.getMetricDetail("followers", query())

    expect(() => metricDetailSchema.parse(detail)).not.toThrow()
  })

  test("omits the comparison series unless compare is requested", async () => {
    const detail = await analyticsRepository.getMetricDetail("likes", query())

    expect(detail.comparisonSeries).toBeNull()
  })

  test("includes a comparison series when compare is requested", async () => {
    const detail = await analyticsRepository.getMetricDetail("likes", query({ compare: "true" }))

    expect(detail.comparisonSeries).not.toBeNull()
    expect(detail.comparisonSeries!.points.length).toBe(detail.series.points.length)
  })

  test("returns the requested metric", async () => {
    const detail = await analyticsRepository.getMetricDetail("bookmarks", query())

    expect(detail.summary.key).toBe("bookmarks")
    expect(detail.series.key).toBe("bookmarks")
  })
})

describe("every period is serviceable", () => {
  // A single-day range yields exactly one bucket. The sparkline schema
  // originally demanded two, so selecting "Today" threw a ZodError and crashed
  // every metric page. Exercise all presets against both read paths.
  const PERIODS = ["today", "7d", "30d", "90d", "12m"] as const

  test.each(PERIODS)("getOverview handles the %s preset", async (period) => {
    await expect(analyticsRepository.getOverview(query({ period }))).resolves.toBeDefined()
  })

  test.each(PERIODS)("getMetricDetail handles the %s preset", async (period) => {
    await expect(
      analyticsRepository.getMetricDetail("followers", query({ period }))
    ).resolves.toBeDefined()
  })

  test("produces a single-bucket series for a single-day range", async () => {
    const detail = await analyticsRepository.getMetricDetail("likes", query({ period: "today" }))

    expect(detail.series.points).toHaveLength(1)
    expect(detail.summary.sparkline).toHaveLength(1)
  })

  test("handles a one-day custom range", async () => {
    await expect(
      analyticsRepository.getOverview(
        query({ period: "custom", from: "2026-03-01", to: "2026-03-01" })
      )
    ).resolves.toBeDefined()
  })

  test("handles comparison mode on a single-day range", async () => {
    const detail = await analyticsRepository.getMetricDetail(
      "likes",
      query({ period: "today", compare: "true" })
    )

    expect(detail.comparisonSeries?.points).toHaveLength(1)
  })
})

describe("analyticsRepository.listPosts", () => {
  test("returns validated posts", async () => {
    const posts = await analyticsRepository.listPosts(query())

    expect(posts.length).toBeGreaterThan(0)
    expect(posts[0]).toHaveProperty("engagementRate")
  })
})

describe("metric catalog", () => {
  test("assigns every metric a palette slot inside the validated 1–8 range", () => {
    // The palette was validated for exactly eight slots; a 9th would be an
    // unvalidated hue.
    for (const definition of Object.values(METRIC_CATALOG)) {
      expect(definition.colorSlot).toBeGreaterThanOrEqual(1)
      expect(definition.colorSlot).toBeLessThanOrEqual(8)
    }
  })

  test("keys every entry to itself, so lookups cannot silently mismatch", () => {
    for (const [key, definition] of Object.entries(METRIC_CATALOG)) {
      expect(definition.key).toBe(key)
    }
  })

  test("gives every metric a non-empty description for its tooltip", () => {
    for (const definition of Object.values(METRIC_CATALOG)) {
      expect(definition.description.length).toBeGreaterThan(10)
    }
  })

  test("getMetricDefinition returns the matching entry", () => {
    expect(getMetricDefinition("followers").label).toBe("Followers")
  })
})

describe("random", () => {
  test("hashSeed is stable for the same input", () => {
    expect(hashSeed("abc")).toBe(hashSeed("abc"))
  })

  test("hashSeed differs for different inputs", () => {
    expect(hashSeed("abc")).not.toBe(hashSeed("abd"))
  })

  test("createRng produces the same sequence for the same seed", () => {
    const a = createRng(42)
    const b = createRng(42)

    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  test("createRng stays within [0, 1)", () => {
    const rng = createRng(7)

    for (let i = 0; i < 500; i += 1) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  test("randomBetween stays within its bounds", () => {
    const rng = createRng(1)

    for (let i = 0; i < 200; i += 1) {
      const value = randomBetween(rng, 10, 20)
      expect(value).toBeGreaterThanOrEqual(10)
      expect(value).toBeLessThan(20)
    }
  })

  test("randomInt is inclusive on both ends", () => {
    const rng = createRng(3)
    const seen = new Set<number>()

    for (let i = 0; i < 500; i += 1) seen.add(randomInt(rng, 1, 3))

    expect(seen).toEqual(new Set([1, 2, 3]))
  })

  test("randomNormal clusters around its mean", () => {
    const rng = createRng(9)
    const samples = Array.from({ length: 2000 }, () => randomNormal(rng, 100, 10))
    const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length

    expect(mean).toBeGreaterThan(95)
    expect(mean).toBeLessThan(105)
  })

  test("pick returns an element from the list", () => {
    const rng = createRng(5)
    const items = ["a", "b", "c"] as const

    for (let i = 0; i < 50; i += 1) {
      expect(items).toContain(pick(rng, items))
    }
  })

  test("pick throws on an empty list rather than returning undefined", () => {
    expect(() => pick(createRng(1), [])).toThrow(/non-empty/)
  })
})
