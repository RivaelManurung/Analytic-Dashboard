import { addDays, addMonths, addWeeks, parseISO } from "date-fns"

import { formatBucketLabel, toIsoDate, type ResolvedRange } from "@/lib/date-range"
import { METRIC_CATALOG, type MetricDefinition } from "@/lib/data/metric-catalog"
import { createRng, hashSeed, pick, randomInt, randomNormal } from "@/lib/data/random"
import type {
  AudienceSegment,
  BreakdownItem,
  CountryStat,
  FunnelStage,
  Granularity,
  MetricKey,
  MetricSummary,
  Post,
  PostChannel,
  PostStatus,
  Timeseries,
  TimeseriesPoint,
} from "@/lib/schemas/analytics"

/**
 * Builds a seed that is stable for a given (metric, range, salt) triple.
 * Requesting the same window twice therefore returns identical numbers, while
 * different windows still look different.
 */
function seedFor(base: number, ...parts: string[]): number {
  return hashSeed(`${base}:${parts.join("|")}`)
}

/** Walks the range one bucket at a time according to the granularity. */
function bucketDates(range: ResolvedRange): Date[] {
  const step: Record<Granularity, (d: Date, n: number) => Date> = {
    day: addDays,
    week: addWeeks,
    month: addMonths,
  }
  const advance = step[range.granularity]

  const end = parseISO(range.to)
  const dates: Date[] = []

  for (let cursor = parseISO(range.from); cursor <= end; cursor = advance(cursor, 1)) {
    dates.push(cursor)
  }

  // A range shorter than one bucket still needs a point to plot.
  return dates.length > 0 ? dates : [parseISO(range.from)]
}

/**
 * Generates a metric series with three components layered together:
 * a trend, a weekly seasonality cycle, and bounded noise. Pure trend + noise
 * produces charts that read as fake; real engagement data has a weekday shape.
 */
function generateSeriesValues(
  definition: MetricDefinition,
  range: ResolvedRange,
  seed: number,
  dates: Date[]
): number[] {
  const rng = createRng(seed)
  const bucketCount = dates.length

  // Scale the 30-day baseline to whatever this bucket actually covers.
  const bucketsPerMonth: Record<Granularity, number> = { day: 30, week: 4.35, month: 1 }
  const perBucket = definition.baseline / bucketsPerMonth[range.granularity]

  // Cumulative metrics (a follower total) are stocks, not flows: they should
  // not be divided across buckets.
  const isStock = definition.key === "followers" || definition.key === "verifiedFollowers"
  const isRate = definition.format === "percent"
  const level = isStock || isRate ? definition.baseline : perBucket

  return dates.map((date, index) => {
    const progress = bucketCount > 1 ? index / (bucketCount - 1) : 1

    // Trend is expressed per month, so scale it by how long the window is.
    const monthsCovered = range.days / 30
    const trendFactor = 1 + definition.trend * monthsCovered * (progress - 0.5)

    // Engagement dips at the weekend. Only meaningful on daily buckets.
    const weekday = date.getDay()
    const seasonal =
      range.granularity === "day" ? 1 + (weekday === 0 || weekday === 6 ? -0.14 : 0.03) : 1

    const noise = randomNormal(rng, 1, definition.volatility)

    const value = level * trendFactor * seasonal * noise

    if (isRate) {
      // Keep a rate inside a believable band instead of letting noise free-run.
      return Math.min(Math.max(value, 0.001), 0.35)
    }
    return Math.max(Math.round(value), 0)
  })
}

export function generateTimeseries(key: MetricKey, range: ResolvedRange, seed: number): Timeseries {
  const definition = METRIC_CATALOG[key]
  const dates = bucketDates(range)
  const values = generateSeriesValues(
    definition,
    range,
    seedFor(seed, key, range.from, range.to),
    dates
  )

  const points: TimeseriesPoint[] = dates.map((date, index) => ({
    date: toIsoDate(date),
    label: formatBucketLabel(date, range.granularity),
    value: values[index]!,
  }))

  return {
    key,
    label: definition.label,
    colorSlot: definition.colorSlot,
    points,
  }
}

/**
 * A stock metric's period value is its latest reading; a flow metric's is the
 * sum over the period. Summing a follower count would be meaningless.
 */
function aggregate(definition: MetricDefinition, values: number[]): number {
  if (values.length === 0) return 0

  if (definition.key === "followers" || definition.key === "verifiedFollowers") {
    return values[values.length - 1]!
  }
  if (definition.format === "percent") {
    return values.reduce((sum, v) => sum + v, 0) / values.length
  }
  return values.reduce((sum, v) => sum + v, 0)
}

export function generateMetricSummary(
  key: MetricKey,
  range: ResolvedRange,
  seed: number
): MetricSummary {
  const definition = METRIC_CATALOG[key]

  const current = generateTimeseries(key, range, seed)
  const currentValue = aggregate(
    definition,
    current.points.map((p) => p.value)
  )

  // The comparison window is the equally sized period immediately before.
  const previousRange: ResolvedRange = {
    ...range,
    from: range.previous.from,
    to: range.previous.to,
  }
  const previous = generateTimeseries(key, previousRange, seed)
  const previousValue = aggregate(
    definition,
    previous.points.map((p) => p.value)
  )

  const delta = currentValue - previousValue
  // Guard the divide: a zero baseline would yield Infinity and render as "∞%".
  const deltaPercent = previousValue === 0 ? 0 : (delta / previousValue) * 100

  return {
    key,
    label: definition.label,
    value: currentValue,
    previousValue,
    delta,
    deltaPercent,
    format: definition.format,
    direction: definition.direction,
    colorSlot: definition.colorSlot,
    description: definition.description,
    sparkline: current.points.map((p) => p.value),
  }
}

/* -------------------------------------------------------------------------- */
/* Funnel                                                                     */
/* -------------------------------------------------------------------------- */

const FUNNEL_STAGES = [
  { id: "impressions", label: "Impressions" },
  { id: "clicks", label: "Clicks" },
  { id: "add-to-cart", label: "Added to cart" },
  { id: "checkout", label: "Checkout started" },
  { id: "payment", label: "Payment completed" },
] as const

export function generateFunnel(range: ResolvedRange, seed: number): FunnelStage[] {
  const rng = createRng(seedFor(seed, "funnel", range.from, range.to))

  const top = Math.round(
    METRIC_CATALOG.impressions.baseline * (range.days / 30) * randomNormal(rng, 1, 0.05)
  )

  // Each stage keeps a share of the one above, so the funnel is monotonic by
  // construction — it can never widen further down.
  const retention = [1, 0.118, 0.412, 0.615, 0.702]

  let running = top
  return FUNNEL_STAGES.map((stage, index) => {
    const rate = retention[index]! * (index === 0 ? 1 : randomNormal(rng, 1, 0.04))
    const clamped = Math.min(Math.max(rate, 0), 1)
    const value = index === 0 ? top : Math.round(running * clamped)
    running = value

    return {
      id: stage.id,
      label: stage.label,
      value,
      conversionFromPrevious: index === 0 ? 1 : clamped,
      conversionFromTop: top === 0 ? 0 : value / top,
    }
  })
}

/* -------------------------------------------------------------------------- */
/* Breakdowns                                                                 */
/* -------------------------------------------------------------------------- */

const CHANNELS: { id: PostChannel; label: string; weight: number; colorSlot: number }[] = [
  { id: "x", label: "X", weight: 0.34, colorSlot: 1 },
  { id: "instagram", label: "Instagram", weight: 0.28, colorSlot: 2 },
  { id: "tiktok", label: "TikTok", weight: 0.19, colorSlot: 3 },
  { id: "linkedin", label: "LinkedIn", weight: 0.12, colorSlot: 4 },
  { id: "youtube", label: "YouTube", weight: 0.07, colorSlot: 5 },
]

/** Normalises raw values into shares that sum to exactly 1. */
function withShares<T extends { value: number }>(items: T[]): (T & { share: number })[] {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return items.map((item) => ({ ...item, share: total === 0 ? 0 : item.value / total }))
}

export function generateChannelBreakdown(
  range: ResolvedRange,
  seed: number,
  metric: MetricKey = "engagement"
): BreakdownItem[] {
  const rng = createRng(seedFor(seed, "channels", metric, range.from))
  const total = METRIC_CATALOG[metric].baseline * (range.days / 30)

  const raw = CHANNELS.map((channel) => ({
    id: channel.id,
    label: channel.label,
    colorSlot: channel.colorSlot,
    value: Math.round(total * channel.weight * randomNormal(rng, 1, 0.1)),
    deltaPercent: randomNormal(rng, 6, 9),
  }))

  return withShares(raw).sort((a, b) => b.value - a.value)
}

const CONTENT_TYPES = [
  { id: "posts", label: "Posts", weight: 0.3, colorSlot: 1 },
  { id: "replies", label: "Replies", weight: 0.24, colorSlot: 2 },
  { id: "likes", label: "Likes", weight: 0.18, colorSlot: 3 },
  { id: "reposts", label: "Reposts", weight: 0.13, colorSlot: 4 },
  { id: "bookmarks", label: "Bookmarks", weight: 0.09, colorSlot: 5 },
  { id: "shares", label: "Shares", weight: 0.06, colorSlot: 6 },
]

export function generateContentPerformance(range: ResolvedRange, seed: number): BreakdownItem[] {
  const rng = createRng(seedFor(seed, "content", range.from))
  const total = METRIC_CATALOG.engagement.baseline * (range.days / 30)

  const raw = CONTENT_TYPES.map((type) => ({
    id: type.id,
    label: type.label,
    colorSlot: type.colorSlot,
    value: Math.round(total * type.weight * randomNormal(rng, 1, 0.12)),
    deltaPercent: randomNormal(rng, 4, 10),
  }))

  return withShares(raw).sort((a, b) => b.value - a.value)
}

const COUNTRIES = [
  { code: "ID", name: "Indonesia", weight: 0.27 },
  { code: "US", name: "United States", weight: 0.19 },
  { code: "IN", name: "India", weight: 0.14 },
  { code: "BR", name: "Brazil", weight: 0.1 },
  { code: "GB", name: "United Kingdom", weight: 0.08 },
  { code: "DE", name: "Germany", weight: 0.06 },
  { code: "JP", name: "Japan", weight: 0.05 },
  { code: "AU", name: "Australia", weight: 0.04 },
  { code: "NG", name: "Nigeria", weight: 0.04 },
  { code: "CA", name: "Canada", weight: 0.03 },
]

export function generateCountryStats(range: ResolvedRange, seed: number): CountryStat[] {
  const rng = createRng(seedFor(seed, "countries", range.from))
  const total = METRIC_CATALOG.reach.baseline * (range.days / 30)

  const raw = COUNTRIES.map((country) => ({
    code: country.code,
    name: country.name,
    value: Math.round(total * country.weight * randomNormal(rng, 1, 0.08)),
    deltaPercent: randomNormal(rng, 5, 11),
  }))

  return withShares(raw).sort((a, b) => b.value - a.value)
}

const AGE_BUCKETS = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"]
const AGE_WEIGHTS = [0.22, 0.34, 0.21, 0.13, 0.07, 0.03]

export function generateAudience(range: ResolvedRange, seed: number): AudienceSegment[] {
  const rng = createRng(seedFor(seed, "audience", range.from))
  const total = METRIC_CATALOG.followers.baseline

  return AGE_BUCKETS.map((bucket, index) => {
    const size = total * AGE_WEIGHTS[index]! * randomNormal(rng, 1, 0.06)
    const maleShare = randomNormal(rng, 0.52, 0.05)
    const otherShare = randomNormal(rng, 0.03, 0.01)

    const male = Math.round(size * Math.min(Math.max(maleShare, 0.3), 0.7))
    const other = Math.round(size * Math.min(Math.max(otherShare, 0.005), 0.08))

    return { bucket, male, female: Math.max(Math.round(size) - male - other, 0), other }
  })
}

/* -------------------------------------------------------------------------- */
/* Posts                                                                      */
/* -------------------------------------------------------------------------- */

const POST_TOPICS = [
  "Behind the scenes of our latest drop",
  "5 lessons from scaling to 2M followers",
  "Why we rebuilt our analytics stack",
  "Customer spotlight",
  "Ask me anything recap",
  "Product update",
  "The metric everyone measures wrong",
  "How we cut checkout friction in half",
  "A thread on retention",
  "Our design system, one year on",
  "What we learned shipping weekly",
  "Community roundup",
  "Field notes from the road",
  "Hiring: we are looking for a data engineer",
  "Quarterly transparency report",
]

const AUTHORS = ["Farhan", "Alya", "Bima", "Citra", "Dimas", "Eka"]
const STATUSES: PostStatus[] = ["published", "published", "published", "scheduled", "draft"]

export function generatePosts(range: ResolvedRange, seed: number, count = 48): Post[] {
  const rng = createRng(seedFor(seed, "posts", range.from, range.to))
  const rangeStart = parseISO(range.from)

  return Array.from({ length: count }, (_, index) => {
    const impressions = Math.max(Math.round(randomNormal(rng, 48_000, 34_000)), 400)

    // Derive interactions from impressions so the engagement rate stays plausible.
    const likes = Math.round(impressions * Math.max(randomNormal(rng, 0.041, 0.016), 0.002))
    const replies = Math.round(likes * Math.max(randomNormal(rng, 0.12, 0.05), 0.01))
    const reposts = Math.round(likes * Math.max(randomNormal(rng, 0.21, 0.07), 0.01))
    const bookmarks = Math.round(likes * Math.max(randomNormal(rng, 0.16, 0.06), 0.01))
    const shares = Math.round(likes * Math.max(randomNormal(rng, 0.09, 0.04), 0.005))

    const engagement = likes + replies + reposts + bookmarks + shares
    const dayOffset = randomInt(rng, 0, Math.max(range.days - 1, 0))

    return {
      id: `post_${(index + 1).toString().padStart(4, "0")}`,
      title: pick(rng, POST_TOPICS),
      channel: pick(rng, CHANNELS).id,
      status: pick(rng, STATUSES),
      publishedAt: toIsoDate(addDays(rangeStart, dayOffset)),
      author: pick(rng, AUTHORS),
      impressions,
      likes,
      replies,
      reposts,
      bookmarks,
      shares,
      engagementRate: impressions === 0 ? 0 : engagement / impressions,
    }
  }).sort((a, b) => b.impressions - a.impressions)
}
