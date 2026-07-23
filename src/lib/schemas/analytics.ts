import { z } from "zod"

/* -------------------------------------------------------------------------- */
/* Query contract                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The time windows the dashboard can be filtered by.
 * `custom` is only valid together with an explicit `from`/`to` pair.
 */
export const periodSchema = z.enum(["today", "7d", "30d", "90d", "12m", "custom"])
export type Period = z.infer<typeof periodSchema>

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
  custom: "Custom range",
}

/** Number of days each preset covers. Drives both bucketing and the API. */
export const PERIOD_DAYS: Record<Exclude<Period, "custom">, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
}

export const granularitySchema = z.enum(["day", "week", "month"])
export type Granularity = z.infer<typeof granularitySchema>

/**
 * Checks that the date exists on the calendar.
 *
 * `Date.parse("2026-02-30")` does NOT fail — JavaScript rolls the overflow
 * forward to 2 March. The only reliable test is to parse it and confirm the
 * components survive the round trip unchanged.
 */
function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return false

  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)")
  .refine(isRealCalendarDate, "Not a real calendar date")

/**
 * Validated query for every analytics read.
 *
 * The `custom` period is the only one that may carry `from`/`to`, and when it
 * does both are required and must be ordered. Encoding that here means no route
 * handler has to re-check it.
 */
export const analyticsQuerySchema = z
  .object({
    period: periodSchema.default("30d"),
    granularity: granularitySchema.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    compare: z.coerce.boolean().default(false),
  })
  .refine((q) => q.period !== "custom" || (q.from && q.to), {
    message: "A custom period requires both `from` and `to`",
    path: ["from"],
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "`from` must be on or before `to`",
    path: ["to"],
  })

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>

/* -------------------------------------------------------------------------- */
/* Metrics                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Every metric the dashboard knows about. Adding one here is the only change
 * needed for it to become routable, chartable, and exportable.
 */
export const metricKeySchema = z.enum([
  "followers",
  "verifiedFollowers",
  "profileVisits",
  "impressions",
  "reach",
  "likes",
  "reposts",
  "bookmarks",
  "shares",
  "posts",
  "replies",
  "engagement",
  "engagementRate",
  "salesOrders",
  "revenue",
])
export type MetricKey = z.infer<typeof metricKeySchema>

export const metricFormatSchema = z.enum(["number", "percent", "currency", "duration"])
export type MetricFormat = z.infer<typeof metricFormatSchema>

/**
 * `direction` says which way is good. Churn going down is a win; followers
 * going down is not — the UI must not colour both the same.
 */
export const metricSummarySchema = z.object({
  key: metricKeySchema,
  label: z.string().min(1),
  value: z.number().finite(),
  previousValue: z.number().finite(),
  delta: z.number().finite(),
  deltaPercent: z.number().finite(),
  format: metricFormatSchema,
  direction: z.enum(["up-is-good", "down-is-good"]).default("up-is-good"),
  /** Index into the 8-slot categorical palette. Fixed per metric, never cycled. */
  colorSlot: z.number().int().min(1).max(8),
  description: z.string(),
  /**
   * One value per bucket in the range.
   *
   * Deliberately NOT `.min(2)`: the "Today" preset is a single day, which
   * yields exactly one bucket, and rejecting that crashed every metric page
   * for that period. Rendering is the right place to handle a short series —
   * `<Sparkline>` returns null below two points rather than drawing a line
   * through one.
   */
  sparkline: z.array(z.number().finite()).min(1),
})
export type MetricSummary = z.infer<typeof metricSummarySchema>

/* -------------------------------------------------------------------------- */
/* Series                                                                     */
/* -------------------------------------------------------------------------- */

export const timeseriesPointSchema = z.object({
  date: isoDate,
  label: z.string(),
  value: z.number().finite(),
})
export type TimeseriesPoint = z.infer<typeof timeseriesPointSchema>

export const timeseriesSchema = z.object({
  key: metricKeySchema,
  label: z.string(),
  colorSlot: z.number().int().min(1).max(8),
  points: z.array(timeseriesPointSchema),
})
export type Timeseries = z.infer<typeof timeseriesSchema>

/* -------------------------------------------------------------------------- */
/* Breakdowns                                                                 */
/* -------------------------------------------------------------------------- */

export const breakdownItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number().finite(),
  share: z.number().min(0).max(1),
  deltaPercent: z.number().finite(),
  colorSlot: z.number().int().min(1).max(8),
})
export type BreakdownItem = z.infer<typeof breakdownItemSchema>

export const funnelStageSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number().finite().nonnegative(),
  /** Share of the stage immediately above. The first stage is always 1. */
  conversionFromPrevious: z.number().min(0).max(1),
  /** Share of the very first stage. */
  conversionFromTop: z.number().min(0).max(1),
})
export type FunnelStage = z.infer<typeof funnelStageSchema>

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

export const postStatusSchema = z.enum(["published", "scheduled", "draft", "archived"])
export type PostStatus = z.infer<typeof postStatusSchema>

export const postChannelSchema = z.enum(["x", "instagram", "linkedin", "tiktok", "youtube"])
export type PostChannel = z.infer<typeof postChannelSchema>

export const CHANNEL_LABELS: Record<PostChannel, string> = {
  x: "X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
}

export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  channel: postChannelSchema,
  status: postStatusSchema,
  publishedAt: z.string(),
  author: z.string(),
  impressions: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  replies: z.number().int().nonnegative(),
  reposts: z.number().int().nonnegative(),
  bookmarks: z.number().int().nonnegative(),
  shares: z.number().int().nonnegative(),
  engagementRate: z.number().min(0),
})
export type Post = z.infer<typeof postSchema>

/* -------------------------------------------------------------------------- */
/* Audience                                                                   */
/* -------------------------------------------------------------------------- */

export const audienceSegmentSchema = z.object({
  bucket: z.string(),
  male: z.number().int().nonnegative(),
  female: z.number().int().nonnegative(),
  other: z.number().int().nonnegative(),
})
export type AudienceSegment = z.infer<typeof audienceSegmentSchema>

export const countryStatSchema = z.object({
  code: z.string().length(2),
  name: z.string(),
  value: z.number().int().nonnegative(),
  share: z.number().min(0).max(1),
  deltaPercent: z.number().finite(),
})
export type CountryStat = z.infer<typeof countryStatSchema>

/* -------------------------------------------------------------------------- */
/* Aggregate payloads                                                         */
/* -------------------------------------------------------------------------- */

export const overviewSchema = z.object({
  range: z.object({ from: isoDate, to: isoDate, granularity: granularitySchema }),
  summaries: z.array(metricSummarySchema),
  series: z.array(timeseriesSchema),
  funnel: z.array(funnelStageSchema),
  channels: z.array(breakdownItemSchema),
  audience: z.array(audienceSegmentSchema),
  countries: z.array(countryStatSchema),
  contentPerformance: z.array(breakdownItemSchema),
})
export type Overview = z.infer<typeof overviewSchema>

export const metricDetailSchema = z.object({
  range: z.object({ from: isoDate, to: isoDate, granularity: granularitySchema }),
  summary: metricSummarySchema,
  series: timeseriesSchema,
  comparisonSeries: timeseriesSchema.nullable(),
  breakdownByChannel: z.array(breakdownItemSchema),
  breakdownByCountry: z.array(countryStatSchema),
  topPosts: z.array(postSchema),
})
export type MetricDetail = z.infer<typeof metricDetailSchema>
