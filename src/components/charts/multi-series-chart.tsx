"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { chartColor, formatCompact, formatFull } from "@/lib/format"
import type { Timeseries } from "@/lib/schemas/analytics"

interface MultiSeriesChartProps {
  series: Timeseries[]
  height?: number
  /** Stacked compares composition; grouped compares magnitude side by side. */
  variant?: "stacked" | "grouped"
}

/**
 * Several metrics on one time axis.
 *
 * Deliberately single-axis. A second y-scale is the most common charting
 * mistake there is — it lets any two series be made to look correlated by
 * choosing the scales. Metrics of different magnitudes belong in separate
 * charts, which is what the per-metric pages are for.
 */
export function MultiSeriesChart({
  series,
  height = 320,
  variant = "stacked",
}: MultiSeriesChartProps) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: chartColor(s.colorSlot) }])
  ) satisfies ChartConfig

  const buckets = series[0]?.points ?? []

  const data = buckets.map((point, index) => {
    const row: Record<string, string | number> = { label: point.label }
    for (const s of series) {
      row[s.key] = s.points[index]?.value ?? 0
    }
    return row
  })

  return (
    <ChartContainer config={config} style={{ height }} className="w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />

        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={24}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(value: number) => formatCompact(value)}
        />

        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={<ChartTooltipContent formatter={(value) => formatFull(Number(value))} />}
        />
        <ChartLegend content={<ChartLegendContent />} />

        {series.map((s, index) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId={variant === "stacked" ? "a" : undefined}
            fill={chartColor(s.colorSlot)}
            // A 2px surface-coloured gap separates stacked segments, so
            // adjacent fills read as distinct even at low contrast.
            stroke="var(--card)"
            strokeWidth={variant === "stacked" ? 2 : 0}
            // Only the topmost segment gets rounded ends, or the stack looks
            // like a pile of separate pills.
            radius={
              variant === "grouped"
                ? [4, 4, 0, 0]
                : index === series.length - 1
                  ? [4, 4, 0, 0]
                  : [0, 0, 0, 0]
            }
            maxBarSize={variant === "grouped" ? 18 : 44}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
