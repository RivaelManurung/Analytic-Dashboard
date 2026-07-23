import { Suspense } from "react"

import { PageShell } from "@/components/dashboard/page-shell"
import { PeriodFilter } from "@/components/dashboard/period-filter"
import { MetricCard } from "@/components/dashboard/metric-card"
import { ChartCard } from "@/components/charts/chart-card"
import { TrendChart } from "@/components/charts/trend-chart"
import { BreakdownBars } from "@/components/charts/breakdown-bars"
import { PostsTable } from "@/components/dashboard/posts-table"
import { analyticsRepository } from "@/lib/data/repository"
import { analyticsQuerySchema, type MetricKey } from "@/lib/schemas/analytics"
import { getMetricDefinition } from "@/lib/data/metric-catalog"
import { formatCompact, formatFull, formatPercentChange, formatShare } from "@/lib/format"
import { ChartSkeleton } from "@/components/states/skeletons"

interface MetricDetailViewProps {
  metricKey: MetricKey
  searchParams: Record<string, string | string[] | undefined>
}

/**
 * The shared body of every single-metric page.
 *
 * Previously each of these pages was a 42-line copy of the same four cards with
 * different strings — eight near-identical files. They are now one component
 * parameterised by metric key, so a change lands everywhere at once.
 */
export async function MetricDetailView({ metricKey, searchParams }: MetricDetailViewProps) {
  const definition = getMetricDefinition(metricKey)

  // Never trust the URL. Invalid params fall back to the default window rather
  // than throwing, since a bad query string should not blank the page.
  const parsed = analyticsQuerySchema.safeParse(searchParams)
  const query = parsed.success ? parsed.data : analyticsQuerySchema.parse({})

  const detail = await analyticsRepository.getMetricDetail(metricKey, query)

  return (
    <PageShell
      title={definition.label}
      description={definition.description}
      actions={<PeriodFilter />}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard metric={detail.summary} featured />
        <SecondaryStat
          label="Daily average"
          value={formatCompact(
            detail.series.points.reduce((sum, p) => sum + p.value, 0) /
              Math.max(detail.series.points.length, 1)
          )}
          hint={`Across ${detail.series.points.length} buckets`}
        />
        <SecondaryStat
          label="Peak"
          value={formatCompact(Math.max(...detail.series.points.map((p) => p.value)))}
          hint={detail.series.points.reduce((best, p) => (p.value > best.value ? p : best)).label}
        />
      </section>

      <ChartCard
        title={`${definition.label} over time`}
        description={`${detail.range.from} → ${detail.range.to}, bucketed by ${detail.range.granularity}. Toggle Compare to overlay the previous period.`}
        table={{
          caption: `${definition.label} by ${detail.range.granularity}`,
          columns: [
            { header: "Period" },
            { header: definition.label, numeric: true },
            ...(detail.comparisonSeries ? [{ header: "Previous", numeric: true }] : []),
          ],
          rows: detail.series.points.map((point, index) => [
            point.label,
            formatFull(point.value),
            ...(detail.comparisonSeries
              ? [formatFull(detail.comparisonSeries.points[index]?.value ?? 0)]
              : []),
          ]),
        }}
      >
        <Suspense fallback={<ChartSkeleton height={300} />}>
          <TrendChart
            series={detail.series}
            comparison={detail.comparisonSeries}
            format={definition.format}
            height={300}
          />
        </Suspense>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="By channel"
          description={`Where ${definition.label.toLowerCase()} came from.`}
          table={{
            columns: [
              { header: "Channel" },
              { header: "Value", numeric: true },
              { header: "Share", numeric: true },
              { header: "Change", numeric: true },
            ],
            rows: detail.breakdownByChannel.map((item) => [
              item.label,
              formatFull(item.value),
              formatShare(item.share),
              formatPercentChange(item.deltaPercent),
            ]),
          }}
        >
          <BreakdownBars items={detail.breakdownByChannel} />
        </ChartCard>

        <ChartCard
          title="By country"
          description="Top markets for this metric."
          table={{
            columns: [
              { header: "Country" },
              { header: "Value", numeric: true },
              { header: "Share", numeric: true },
            ],
            rows: detail.breakdownByCountry.map((item) => [
              item.name,
              formatFull(item.value),
              formatShare(item.share),
            ]),
          }}
        >
          <BreakdownBars
            items={detail.breakdownByCountry.map((country, index) => ({
              id: country.code,
              label: country.name,
              value: country.value,
              share: country.share,
              deltaPercent: country.deltaPercent,
              // Fixed slot per rank position; never generates a new hue.
              colorSlot: (index % 8) + 1,
            }))}
            limit={6}
          />
        </ChartCard>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Top performing posts</h2>
        <PostsTable posts={detail.topPosts} />
      </section>
    </PageShell>
  )
}

function SecondaryStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="tabular-figures mt-3 text-3xl leading-none font-semibold tracking-[-0.03em]">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
