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
import { formatCompact, formatFull } from "@/lib/format"
import type { AudienceSegment } from "@/lib/schemas/analytics"

/**
 * Audience composition by age bracket.
 *
 * Horizontal bars because the category labels ("25–34") read better along the
 * y-axis than rotated under an x-axis. Stacked, since the question is
 * composition within each bracket rather than comparison across genders.
 *
 * Slots 1, 5, and 3 — adjacent pairs in the validated categorical order.
 */
const config = {
  male: { label: "Male", color: "var(--chart-1)" },
  female: { label: "Female", color: "var(--chart-5)" },
  other: { label: "Other", color: "var(--chart-3)" },
} satisfies ChartConfig

export function AudienceChart({
  segments,
  height = 260,
}: {
  segments: AudienceSegment[]
  height?: number
}) {
  return (
    <ChartContainer config={config} style={{ height }} className="w-full">
      <BarChart data={segments} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />

        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(value: number) => formatCompact(value)}
        />
        <YAxis
          type="category"
          dataKey="bucket"
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />

        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={<ChartTooltipContent formatter={(value) => formatFull(Number(value))} />}
        />
        <ChartLegend content={<ChartLegendContent />} />

        {/* A 2px surface-coloured stroke keeps adjacent stacked segments
            visually separated even where their fills are close in contrast. */}
        <Bar
          dataKey="male"
          stackId="a"
          fill="var(--chart-1)"
          stroke="var(--card)"
          strokeWidth={2}
        />
        <Bar
          dataKey="female"
          stackId="a"
          fill="var(--chart-5)"
          stroke="var(--card)"
          strokeWidth={2}
        />
        <Bar
          dataKey="other"
          stackId="a"
          fill="var(--chart-3)"
          stroke="var(--card)"
          strokeWidth={2}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
