import type { MetricFormat } from "@/lib/schemas/analytics"

/**
 * A fixed locale keeps server and client output identical. Reading the
 * visitor's locale here would produce a hydration mismatch, because the server
 * has no access to it at render time.
 */
const LOCALE = "en-US"

const compactNumber = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
})

const fullNumber = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })

const currency = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
})

const fullCurrency = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const percent = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})

/** Compact form for axis ticks and cards: 2.1M, 44.9K. */
export function formatCompact(value: number): string {
  return compactNumber.format(value)
}

/** Full form for tooltips and tables, where precision matters. */
export function formatFull(value: number): string {
  return fullNumber.format(value)
}

export function formatDuration(seconds: number): string {
  const total = Math.max(Math.round(seconds), 0)
  const minutes = Math.floor(total / 60)
  const remainder = total % 60
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`
}

/** Formats by the metric's declared type. Compact by default. */
export function formatMetric(
  value: number,
  format: MetricFormat,
  options: { compact?: boolean } = {}
): string {
  const { compact = true } = options

  switch (format) {
    case "percent":
      return percent.format(value)
    case "currency":
      return compact ? currency.format(value) : fullCurrency.format(value)
    case "duration":
      return formatDuration(value)
    case "number":
      return compact ? formatCompact(value) : formatFull(value)
  }
}

/** Always signed, so a rise and a fall are distinguishable without colour. */
export function formatDelta(value: number, format: MetricFormat): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatMetric(Math.abs(value), format)}`
}

export function formatPercentChange(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${Math.abs(value).toFixed(1)}%`
}

export function formatShare(share: number): string {
  return percent.format(share)
}

/**
 * Whether a change should read as good.
 *
 * Not every metric wants to go up — for a churn-style metric a fall is the win.
 * Returns null for no change, so the UI can render a neutral state instead of
 * arbitrarily picking a colour.
 */
export function isImprovement(
  delta: number,
  direction: "up-is-good" | "down-is-good"
): boolean | null {
  if (delta === 0) return null
  return direction === "up-is-good" ? delta > 0 : delta < 0
}

/** CSS var for a categorical palette slot. Slots are fixed, never cycled. */
export function chartColor(slot: number): string {
  const clamped = Math.min(Math.max(Math.round(slot), 1), 8)
  return `var(--chart-${clamped})`
}
