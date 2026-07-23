import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns"

import {
  PERIOD_DAYS,
  type AnalyticsQuery,
  type Granularity,
  type Period,
} from "@/lib/schemas/analytics"

export interface ResolvedRange {
  from: string
  to: string
  /** Inclusive day count. A single-day range is 1, not 0. */
  days: number
  granularity: Granularity
  /** The equally sized window immediately before `from`, for comparisons. */
  previous: { from: string; to: string }
}

export const toIsoDate = (date: Date): string => format(date, "yyyy-MM-dd")

/**
 * Picks a bucket size that keeps a chart readable: roughly 7–60 points.
 * Plotting 365 daily points on a 400px-wide card is unreadable.
 */
export function inferGranularity(days: number): Granularity {
  if (days <= 31) return "day"
  if (days <= 120) return "week"
  return "month"
}

/**
 * Turns a validated query into concrete dates.
 *
 * `today` is injected rather than read from the clock so tests are not
 * time-dependent and server/client renders agree.
 */
export function resolveRange(query: AnalyticsQuery, today: Date): ResolvedRange {
  const { from, to } = resolveEndpoints(query, today)

  const days = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1
  const granularity = query.granularity ?? inferGranularity(days)

  const previousTo = subDays(parseISO(from), 1)
  const previousFrom = subDays(previousTo, days - 1)

  return {
    from,
    to,
    days,
    granularity,
    previous: { from: toIsoDate(previousFrom), to: toIsoDate(previousTo) },
  }
}

function resolveEndpoints(query: AnalyticsQuery, today: Date): { from: string; to: string } {
  // The schema guarantees a custom period carries both endpoints.
  if (query.period === "custom" && query.from && query.to) {
    return { from: query.from, to: query.to }
  }

  const period = query.period as Exclude<Period, "custom">
  const days = PERIOD_DAYS[period]

  return { from: toIsoDate(subDays(today, days - 1)), to: toIsoDate(today) }
}

/** Axis label matched to the bucket size. */
export function formatBucketLabel(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case "day":
      return format(date, "d MMM")
    case "week":
      return format(date, "d MMM")
    case "month":
      return format(date, "MMM yyyy")
  }
}
