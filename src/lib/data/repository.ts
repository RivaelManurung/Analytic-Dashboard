import "server-only"

import { env } from "@/lib/env"
import { resolveRange, type ResolvedRange } from "@/lib/date-range"
import { OVERVIEW_METRIC_KEYS } from "@/lib/data/metric-catalog"
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
import {
  metricDetailSchema,
  overviewSchema,
  postSchema,
  type AnalyticsQuery,
  type MetricDetail,
  type MetricKey,
  type Overview,
  type Post,
} from "@/lib/schemas/analytics"

/**
 * The read surface the dashboard depends on.
 *
 * Pages and route handlers talk to this interface, never to the generator. To
 * move onto a real database, implement this against Prisma/Drizzle and swap the
 * export at the bottom of this file — no UI code changes.
 */
export interface AnalyticsRepository {
  getOverview(query: AnalyticsQuery): Promise<Overview>
  getMetricDetail(key: MetricKey, query: AnalyticsQuery): Promise<MetricDetail>
  listPosts(query: AnalyticsQuery): Promise<Post[]>
}

/**
 * Fixes "today" so the dataset does not drift between requests, between the
 * server and client render, or between a test run and its recorded snapshot.
 * A real implementation would use the actual clock.
 */
const REFERENCE_TODAY = new Date(2026, 6, 23)

class SeededAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly seed: number) {}

  private resolve(query: AnalyticsQuery): ResolvedRange {
    return resolveRange(query, REFERENCE_TODAY)
  }

  async getOverview(query: AnalyticsQuery): Promise<Overview> {
    const range = this.resolve(query)

    const payload = {
      range: { from: range.from, to: range.to, granularity: range.granularity },
      summaries: OVERVIEW_METRIC_KEYS.map((key) => generateMetricSummary(key, range, this.seed)),
      series: OVERVIEW_METRIC_KEYS.map((key) => generateTimeseries(key, range, this.seed)),
      funnel: generateFunnel(range, this.seed),
      channels: generateChannelBreakdown(range, this.seed),
      audience: generateAudience(range, this.seed),
      countries: generateCountryStats(range, this.seed),
      contentPerformance: generateContentPerformance(range, this.seed),
    }

    // Parsing our own output looks redundant, but it means a generator bug
    // surfaces here rather than as a broken chart three layers away.
    return overviewSchema.parse(payload)
  }

  async getMetricDetail(key: MetricKey, query: AnalyticsQuery): Promise<MetricDetail> {
    const range = this.resolve(query)

    const comparisonRange: ResolvedRange = {
      ...range,
      from: range.previous.from,
      to: range.previous.to,
    }

    const payload = {
      range: { from: range.from, to: range.to, granularity: range.granularity },
      summary: generateMetricSummary(key, range, this.seed),
      series: generateTimeseries(key, range, this.seed),
      comparisonSeries: query.compare ? generateTimeseries(key, comparisonRange, this.seed) : null,
      breakdownByChannel: generateChannelBreakdown(range, this.seed, key),
      breakdownByCountry: generateCountryStats(range, this.seed),
      topPosts: generatePosts(range, this.seed, 10),
    }

    return metricDetailSchema.parse(payload)
  }

  async listPosts(query: AnalyticsQuery): Promise<Post[]> {
    const range = this.resolve(query)
    return generatePosts(range, this.seed).map((post) => postSchema.parse(post))
  }
}

export const analyticsRepository: AnalyticsRepository = new SeededAnalyticsRepository(
  env.ANALYTICS_SEED
)
