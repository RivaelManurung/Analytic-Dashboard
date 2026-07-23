import type { Metadata } from "next"

import { PageShell } from "@/components/dashboard/page-shell"
import { PeriodFilter } from "@/components/dashboard/period-filter"
import { MetricCard } from "@/components/dashboard/metric-card"
import { ChartCard } from "@/components/charts/chart-card"
import { MultiSeriesChart } from "@/components/charts/multi-series-chart"
import { BreakdownBars } from "@/components/charts/breakdown-bars"
import { FunnelChart } from "@/components/charts/funnel-chart"
import { AudienceChart } from "@/components/charts/audience-chart"
import { analyticsRepository } from "@/lib/data/repository"
import { getMetricDefinition } from "@/lib/data/metric-catalog"
import { analyticsQuerySchema } from "@/lib/schemas/analytics"
import { formatFull, formatPercentChange, formatShare } from "@/lib/format"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Every headline metric for your workspace on one screen.",
}

export default async function DashboardPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams

  // The URL is user input. An invalid query falls back to the default window
  // rather than throwing — a bad param should not blank the whole dashboard.
  const parsed = analyticsQuerySchema.safeParse(searchParams)
  const query = parsed.success ? parsed.data : analyticsQuerySchema.parse({})

  const overview = await analyticsRepository.getOverview(query)

  return (
    <PageShell
      title="Dashboard"
      description={`All analytics for ${overview.range.from} → ${overview.range.to}, bucketed by ${overview.range.granularity}.`}
      actions={<PeriodFilter />}
    >
      <section aria-label="Headline metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {overview.summaries.map((summary) => (
          <MetricCard
            key={summary.key}
            metric={summary}
            href={getMetricDefinition(summary.key).href}
          />
        ))}
      </section>

      {/* 12-column composition: the primary chart earns two thirds, the two
          supporting cards stack beside it rather than competing for width. */}
      <section className="grid gap-6 lg:grid-cols-12">
        <ChartCard
          className="lg:col-span-8"
          title="Metrics over time"
          description="Stacked composition across the five headline metrics. One shared axis — never two scales."
          table={{
            caption: "Headline metrics by period",
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
          <MultiSeriesChart series={overview.series} height={360} />
        </ChartCard>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <ChartCard
            title="By channel"
            description="Engagement split across connected platforms."
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
            title="Conversion funnel"
            description="Impressions through to completed payment."
            table={{
              columns: [
                { header: "Stage" },
                { header: "Count", numeric: true },
                { header: "From previous", numeric: true },
                { header: "From top", numeric: true },
              ],
              rows: overview.funnel.map((stage) => [
                stage.label,
                formatFull(stage.value),
                formatShare(stage.conversionFromPrevious),
                formatShare(stage.conversionFromTop),
              ]),
            }}
          >
            <FunnelChart stages={overview.funnel} />
          </ChartCard>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Content performance"
          description="Which interaction types are driving engagement."
          table={{
            columns: [
              { header: "Type" },
              { header: "Count", numeric: true },
              { header: "Share", numeric: true },
              { header: "Change", numeric: true },
            ],
            rows: overview.contentPerformance.map((item) => [
              item.label,
              formatFull(item.value),
              formatShare(item.share),
              formatPercentChange(item.deltaPercent),
            ]),
          }}
        >
          <BreakdownBars items={overview.contentPerformance} />
        </ChartCard>

        <ChartCard
          title="Audience by age and gender"
          description="Follower composition across age brackets."
          table={{
            columns: [
              { header: "Age" },
              { header: "Male", numeric: true },
              { header: "Female", numeric: true },
              { header: "Other", numeric: true },
            ],
            rows: overview.audience.map((segment) => [
              segment.bucket,
              formatFull(segment.male),
              formatFull(segment.female),
              formatFull(segment.other),
            ]),
          }}
        >
          <AudienceChart segments={overview.audience} />
        </ChartCard>

        <ChartCard
          title="Top countries"
          description="Where your reach is concentrated."
          table={{
            columns: [
              { header: "Country" },
              { header: "Reach", numeric: true },
              { header: "Share", numeric: true },
            ],
            rows: overview.countries.map((country) => [
              country.name,
              formatFull(country.value),
              formatShare(country.share),
            ]),
          }}
        >
          <BreakdownBars
            items={overview.countries.map((country, index) => ({
              id: country.code,
              label: country.name,
              value: country.value,
              share: country.share,
              deltaPercent: country.deltaPercent,
              colorSlot: (index % 8) + 1,
            }))}
            limit={6}
          />
        </ChartCard>
      </section>
    </PageShell>
  )
}
