"use client"

import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { chartColor, formatCompact, formatMetric } from "@/lib/format"
import type { MetricFormat, Timeseries } from "@/lib/schemas/analytics"

interface TrendChartProps {
  series: Timeseries
  /** Same metric over the preceding window, drawn as a dashed reference line. */
  comparison?: Timeseries | null
  format: MetricFormat
  height?: number
}

/**
 * Single-metric trend over time.
 *
 * One series means no legend box — the card title already names the metric.
 * A comparison series is drawn as a dashed line so the two are distinguishable
 * without relying on colour.
 */
export function TrendChart({ series, comparison, format, height = 280 }: TrendChartProps) {
  const config = {
    value: { label: series.label, color: chartColor(series.colorSlot) },
    comparison: { label: "Previous period", color: "var(--muted-foreground)" },
  } satisfies ChartConfig

  // Recharts needs one row per x value, so the two series are zipped by index.
  // Both windows have the same bucket count, so index alignment is correct.
  const data = series.points.map((point, index) => ({
    label: point.label,
    value: point.value,
    comparison: comparison?.points[index]?.value ?? null,
  }))

  const gradientId = `trend-gradient-${series.key}`

  return (
    <ChartContainer config={config} style={{ height }} className="w-full">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColor(series.colorSlot)} stopOpacity={0.28} />
            <stop offset="100%" stopColor={chartColor(series.colorSlot)} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Recessive grid: horizontal only, so it guides the eye without
            competing with the data. */}
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
          tickFormatter={(value: number) =>
            format === "percent" ? `${(value * 100).toFixed(1)}%` : formatCompact(value)
          }
        />

        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              formatter={(value) => formatMetric(Number(value), format, { compact: false })}
            />
          }
        />

        {comparison && (
          <Line
            type="monotone"
            dataKey="comparison"
            stroke="var(--muted-foreground)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            // Gaps are real (no comparison point), not values to interpolate.
            connectNulls={false}
          />
        )}

        <Area
          type="monotone"
          dataKey="value"
          stroke={chartColor(series.colorSlot)}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          // Hidden until hover, so the line stays thin at rest.
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
