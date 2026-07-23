import type { Route } from "next"

import type { MetricFormat, MetricKey } from "@/lib/schemas/analytics"

export interface MetricDefinition {
  key: MetricKey
  label: string
  format: MetricFormat
  /** Which way is good. Not every metric wants to go up. */
  direction: "up-is-good" | "down-is-good"
  /**
   * Fixed slot in the 8-colour categorical palette.
   * Assigned per metric and never cycled — a filter that removes series must
   * not repaint the survivors.
   */
  colorSlot: number
  /** Typical value for a 30-day window; the generator scales from here. */
  baseline: number
  /** Relative day-to-day noise. Rates wobble less than raw counts. */
  volatility: number
  /** Monthly drift. Positive metrics trend up; churn-like metrics trend down. */
  trend: number
  description: string
  /** Route under /(dashboard), when the metric has its own page. Typed, so a typo fails the build. */
  href?: Route
}

/**
 * The metric registry. This is the single place a metric is defined — the
 * sidebar, the API, the charts, and the export all read from it, so adding a
 * metric is one entry rather than a change in six files.
 */
export const METRIC_CATALOG: Record<MetricKey, MetricDefinition> = {
  followers: {
    key: "followers",
    label: "Followers",
    format: "number",
    direction: "up-is-good",
    colorSlot: 1,
    baseline: 2_132_435,
    volatility: 0.012,
    trend: 0.06,
    description: "Total accounts following your profile at the end of the period.",
    href: "/followers",
  },
  verifiedFollowers: {
    key: "verifiedFollowers",
    label: "Verified followers",
    format: "number",
    direction: "up-is-good",
    colorSlot: 7,
    baseline: 48_210,
    volatility: 0.02,
    trend: 0.09,
    description: "Followers with a verified badge — a proxy for audience quality.",
    href: "/verified-followers",
  },
  profileVisits: {
    key: "profileVisits",
    label: "Profile visits",
    format: "number",
    direction: "up-is-good",
    colorSlot: 3,
    baseline: 184_320,
    volatility: 0.08,
    trend: 0.04,
    description: "Times your profile page was opened.",
    href: "/profile-visits",
  },
  impressions: {
    key: "impressions",
    label: "Impressions",
    format: "number",
    direction: "up-is-good",
    colorSlot: 2,
    baseline: 7_435_000,
    volatility: 0.11,
    trend: 0.12,
    description: "Times your content was rendered on a screen, including repeats.",
    href: "/impressions",
  },
  reach: {
    key: "reach",
    label: "Reach",
    format: "number",
    direction: "up-is-good",
    colorSlot: 4,
    baseline: 3_190_400,
    volatility: 0.09,
    trend: 0.08,
    description: "Unique accounts that saw your content at least once.",
  },
  likes: {
    key: "likes",
    label: "Likes",
    format: "number",
    direction: "up-is-good",
    colorSlot: 8,
    baseline: 312_800,
    volatility: 0.13,
    trend: 0.07,
    description: "Total likes across all published content.",
    href: "/likes",
  },
  reposts: {
    key: "reposts",
    label: "Reposts",
    format: "number",
    direction: "up-is-good",
    colorSlot: 5,
    baseline: 84_120,
    volatility: 0.16,
    trend: 0.05,
    description: "Times your content was shared onto another timeline.",
    href: "/reposts",
  },
  bookmarks: {
    key: "bookmarks",
    label: "Bookmarks",
    format: "number",
    direction: "up-is-good",
    colorSlot: 6,
    baseline: 41_060,
    volatility: 0.14,
    trend: 0.11,
    description: "Saves — the strongest signal that content has lasting value.",
    href: "/bookmarks",
  },
  shares: {
    key: "shares",
    label: "Shares",
    format: "number",
    direction: "up-is-good",
    colorSlot: 3,
    baseline: 67_940,
    volatility: 0.15,
    trend: 0.06,
    description: "Times your content was sent directly to another person.",
    href: "/shares",
  },
  posts: {
    key: "posts",
    label: "Posts",
    format: "number",
    direction: "up-is-good",
    colorSlot: 1,
    baseline: 248,
    volatility: 0.22,
    trend: 0.02,
    description: "Pieces of content published in the period.",
    href: "/posts",
  },
  replies: {
    key: "replies",
    label: "Replies",
    format: "number",
    direction: "up-is-good",
    colorSlot: 2,
    baseline: 18_430,
    volatility: 0.18,
    trend: 0.03,
    description: "Direct responses to your content.",
    href: "/replies",
  },
  engagement: {
    key: "engagement",
    label: "Engagement",
    format: "number",
    direction: "up-is-good",
    colorSlot: 4,
    baseline: 524_350,
    volatility: 0.12,
    trend: 0.09,
    description: "Sum of likes, replies, reposts, bookmarks, and shares.",
    href: "/engagement",
  },
  engagementRate: {
    key: "engagementRate",
    label: "Engagement rate",
    format: "percent",
    direction: "up-is-good",
    colorSlot: 5,
    baseline: 0.0705,
    // A ratio is far more stable than the counts it is derived from.
    volatility: 0.05,
    trend: 0.01,
    description: "Engagement divided by impressions.",
    href: "/engagement-rate",
  },
  salesOrders: {
    key: "salesOrders",
    label: "Sales orders",
    format: "number",
    direction: "up-is-good",
    colorSlot: 6,
    baseline: 134_435,
    volatility: 0.1,
    trend: 0.08,
    description: "Orders attributed to social traffic.",
  },
  revenue: {
    key: "revenue",
    label: "Revenue",
    format: "currency",
    direction: "up-is-good",
    colorSlot: 7,
    baseline: 1_284_500,
    volatility: 0.12,
    trend: 0.1,
    description: "Gross revenue attributed to social traffic.",
  },
}

/** The five headline metrics shown on the overview page, in display order. */
export const OVERVIEW_METRIC_KEYS: readonly MetricKey[] = [
  "followers",
  "reach",
  "engagement",
  "impressions",
  "salesOrders",
] as const

export function getMetricDefinition(key: MetricKey): MetricDefinition {
  return METRIC_CATALOG[key]
}
