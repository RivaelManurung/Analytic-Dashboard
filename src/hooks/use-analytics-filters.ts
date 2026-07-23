"use client"

import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"

import { PERIOD_DAYS, type Period } from "@/lib/schemas/analytics"

const PERIODS = ["today", "7d", "30d", "90d", "12m", "custom"] as const satisfies readonly Period[]

/**
 * Dashboard filters, stored in the URL rather than component state.
 *
 * The URL is the right home for this: a filtered view becomes a shareable
 * link, the back button works, and a refresh does not silently reset the
 * range the user chose.
 */
export function useAnalyticsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      period: parseAsStringLiteral(PERIODS).withDefault("30d"),
      from: parseAsString,
      to: parseAsString,
      compare: parseAsBoolean.withDefault(false),
    },
    {
      // Keeps the page a Server Component render rather than a client-side
      // patch, so the new range is fetched on the server.
      shallow: false,
      // Rapid clicking through presets should not flood the history stack.
      history: "replace",
      throttleMs: 120,
    }
  )

  /** Switching to a preset clears any custom endpoints so they cannot conflict. */
  const setPeriod = (period: Period) =>
    setFilters(period === "custom" ? { period } : { period, from: null, to: null })

  /** Setting an explicit range implies the custom preset. */
  const setRange = (from: string | null, to: string | null) =>
    setFilters({ period: "custom", from, to })

  const toggleCompare = () => setFilters({ compare: !filters.compare })

  const reset = () => setFilters({ period: "30d", from: null, to: null, compare: false })

  return { filters, setFilters, setPeriod, setRange, toggleCompare, reset }
}

/** Human-readable summary of the active range, for headers and export names. */
export function describePeriod(period: Period, from?: string | null, to?: string | null): string {
  if (period === "custom") {
    return from && to ? `${from} → ${to}` : "Custom range"
  }
  const days = PERIOD_DAYS[period]
  return days === 1 ? "Today" : `Last ${days} days`
}
