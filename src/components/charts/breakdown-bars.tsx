"use client"

import { ArrowDown, ArrowUp } from "lucide-react"

import { chartColor, formatCompact, formatPercentChange, formatShare } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { BreakdownItem } from "@/lib/schemas/analytics"

interface BreakdownBarsProps {
  items: BreakdownItem[]
  /** Cap the list; the remainder is folded into an "Other" row. */
  limit?: number
}

/**
 * Ranked horizontal bars.
 *
 * Preferred over a pie or donut for ranking: length on a common baseline is far
 * easier to compare than angle. Every row is directly labelled with its value
 * and share, so identity never depends on colour alone.
 */
export function BreakdownBars({ items, limit }: BreakdownBarsProps) {
  const visible = limit ? items.slice(0, limit) : items
  const hidden = limit ? items.slice(limit) : []

  // Bars are scaled against the largest value, not the total, so the shape of
  // the ranking stays readable when one item dominates.
  const max = Math.max(...visible.map((item) => item.value), 1)

  const rows = [...visible]

  if (hidden.length > 0) {
    const otherValue = hidden.reduce((sum, item) => sum + item.value, 0)
    rows.push({
      id: "__other",
      label: `Other (${hidden.length})`,
      value: otherValue,
      share: hidden.reduce((sum, item) => sum + item.share, 0),
      deltaPercent: 0,
      // Slot 8 is the last categorical slot; "Other" never generates a new hue.
      colorSlot: 8,
    })
  }

  return (
    <ul className="space-y-3.5">
      {rows.map((item) => {
        const isUp = item.deltaPercent >= 0

        return (
          <li key={item.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: chartColor(item.colorSlot) }}
                />
                <span className="truncate text-sm font-medium">{item.label}</span>
              </span>

              <span className="flex shrink-0 items-baseline gap-2.5">
                <span className="tabular-figures text-sm font-semibold">
                  {formatCompact(item.value)}
                </span>
                <span className="tabular-figures text-xs text-muted-foreground">
                  {formatShare(item.share)}
                </span>
                {item.id !== "__other" && (
                  <span
                    className={cn(
                      "tabular-figures inline-flex items-center gap-0.5 text-xs font-medium",
                      isUp ? "text-positive" : "text-destructive"
                    )}
                  >
                    {isUp ? (
                      <ArrowUp className="size-3" aria-hidden />
                    ) : (
                      <ArrowDown className="size-3" aria-hidden />
                    )}
                    {formatPercentChange(item.deltaPercent)}
                  </span>
                )}
              </span>
            </div>

            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`${item.label}: ${formatCompact(item.value)}, ${formatShare(item.share)} of total`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: chartColor(item.colorSlot),
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
