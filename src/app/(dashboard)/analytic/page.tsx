import type { Metadata } from "next"

import { PageShell } from "@/components/dashboard/page-shell"
import { PeriodFilter } from "@/components/dashboard/period-filter"
import { MetricCard } from "@/components/dashboard/metric-card"
import { ChartCard } from "@/components/charts/chart-card"
import { MultiSeriesChart } from "@/components/charts/multi-series-chart"
import { TrendChart } from "@/components/charts/trend-chart"
import { BreakdownBars } from "@/components/charts/breakdown-bars"
import { PostsTable } from "@/components/dashboard/posts-table"
import { analyticsRepository } from "@/lib/data/repository"
import { getMetricDefinition } from "@/lib/data/metric-catalog"
import { analyticsQuerySchema } from "@/lib/schemas/analytics"
import { formatFull, formatShare } from "@/lib/format"

export const metadata: Metadata = {
  title: "Analytics",
  description: "Compare metrics side by side across any period.",
}

export default async function AnalyticPage(props: PageProps<"/analytic">) {
  const searchParams = await props.searchParams

  const parsed = analyticsQuerySchema.safeParse(searchParams)
  const query = parsed.success ? parsed.data : analyticsQuerySchema.parse({})

  // Fetched in parallel. Awaiting these in sequence would turn three
  // independent reads into a request waterfall.
  const [overview, engagement, posts] = await Promise.all([
    analyticsRepository.getOverview(query),
    analyticsRepository.getMetricDetail("engagementRate", { ...query, compare: true }),
    analyticsRepository.listPosts(query),
  ])

  return (
    <PageShell
      title="Analytics"
      description="Deep dive across every metric, with the previous period overlaid for comparison."
      actions={<PeriodFilter />}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {overview.summaries.map((summary) => (
          <MetricCard
            key={summary.key}
            metric={summary}
            href={getMetricDefinition(summary.key).href}
          />
        ))}
      </section>

      <ChartCard
        title="Engagement rate versus previous period"
        description="A rate normalises for reach, so a spike here is real resonance rather than simply more impressions."
        table={{
          columns: [
            { header: "Period" },
            { header: "This period", numeric: true },
            { header: "Previous", numeric: true },
          ],
          rows: engagement.series.points.map((point, index) => [
            point.label,
            formatShare(point.value),
            formatShare(engagement.comparisonSeries?.points[index]?.value ?? 0),
          ]),
        }}
      >
        <TrendChart
          series={engagement.series}
          comparison={engagement.comparisonSeries}
          format="percent"
          height={300}
        />
      </ChartCard>

      <ChartCard
        title="All metrics, grouped"
        description="Grouped rather than stacked, so every metric is read against the same baseline."
        table={{
          columns: [
            { header: "Period" },
            ...overview.series.map((series) => ({ header: series.label, numeric: true })),
          ],
          rows: (overview.series[0]?.points ?? []).map((point, index) => [
            point.label,
            ...overview.series.map((series) => formatFull(series.points[index]?.value ?? 0)),
          ]),
        }}
      >
        <MultiSeriesChart series={overview.series} variant="grouped" height={340} />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Channel mix"
          description="Engagement contribution by platform."
          table={{
            columns: [
              { header: "Channel" },
              { header: "Engagement", numeric: true },
              { header: "Share", numeric: true },
            ],
            rows: overview.channels.map((item) => [
              item.label,
              formatFull(item.value),
              formatShare(item.share),
            ]),
          }}
        >
          <BreakdownBars items={overview.channels} />
        </ChartCard>

        <ChartCard
          title="Interaction mix"
          description="Which interaction types make up your engagement."
          table={{
            columns: [
              { header: "Type" },
              { header: "Count", numeric: true },
              { header: "Share", numeric: true },
            ],
            rows: overview.contentPerformance.map((item) => [
              item.label,
              formatFull(item.value),
              formatShare(item.share),
            ]),
          }}
        >
          <BreakdownBars items={overview.contentPerformance} />
        </ChartCard>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">All posts in this period</h2>
        <PostsTable posts={posts} pageSize={12} />
      </section>
    </PageShell>
  )
}
