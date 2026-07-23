import type { Metadata } from "next"

import { PageShell } from "@/components/dashboard/page-shell"
import { PeriodFilter } from "@/components/dashboard/period-filter"
import { ChartCard } from "@/components/charts/chart-card"
import { AudienceChart } from "@/components/charts/audience-chart"
import { BreakdownBars } from "@/components/charts/breakdown-bars"
import { StatStrip } from "@/components/workspace/stat-strip"
import { analyticsRepository } from "@/lib/data/repository"
import { analyticsQuerySchema } from "@/lib/schemas/analytics"
import { formatCompact, formatFull, formatShare } from "@/lib/format"

export const metadata: Metadata = {
  title: "Demographics",
  description: "Who your audience is — age, gender, and geography.",
}

export default async function AudiencePage(props: PageProps<"/audience">) {
  const searchParams = await props.searchParams

  const parsed = analyticsQuerySchema.safeParse(searchParams)
  const query = parsed.success ? parsed.data : analyticsQuerySchema.parse({})

  const overview = await analyticsRepository.getOverview(query)

  const totalAudience = overview.audience.reduce(
    (sum, segment) => sum + segment.male + segment.female + segment.other,
    0
  )
  const largestBracket = overview.audience.reduce((best, segment) =>
    segment.male + segment.female + segment.other > best.male + best.female + best.other
      ? segment
      : best
  )
  const topCountry = overview.countries[0]

  return (
    <PageShell
      title="Demographics"
      description="Audience composition across age brackets, gender, and market."
      actions={<PeriodFilter />}
    >
      <StatStrip
        stats={[
          { label: "Total audience", value: formatCompact(totalAudience) },
          {
            label: "Largest bracket",
            value: largestBracket.bucket,
            hint: `${formatCompact(largestBracket.male + largestBracket.female + largestBracket.other)} followers`,
          },
          {
            label: "Top market",
            value: topCountry?.name ?? "—",
            hint: topCountry ? `${formatShare(topCountry.share)} of reach` : undefined,
          },
          { label: "Markets tracked", value: String(overview.countries.length) },
        ]}
      />

      <ChartCard
        title="Age and gender"
        description="Composition within each age bracket. Bars are stacked because the question is mix, not comparison across genders."
        table={{
          caption: "Audience by age bracket and gender",
          columns: [
            { header: "Age" },
            { header: "Male", numeric: true },
            { header: "Female", numeric: true },
            { header: "Other", numeric: true },
            { header: "Total", numeric: true },
          ],
          rows: overview.audience.map((segment) => [
            segment.bucket,
            formatFull(segment.male),
            formatFull(segment.female),
            formatFull(segment.other),
            formatFull(segment.male + segment.female + segment.other),
          ]),
        }}
      >
        <AudienceChart segments={overview.audience} height={320} />
      </ChartCard>

      <ChartCard
        title="Reach by country"
        description="All tracked markets, ranked."
        table={{
          columns: [
            { header: "Country" },
            { header: "Reach", numeric: true },
            { header: "Share", numeric: true },
            { header: "Change", numeric: true },
          ],
          rows: overview.countries.map((country) => [
            country.name,
            formatFull(country.value),
            formatShare(country.share),
            `${country.deltaPercent > 0 ? "+" : ""}${country.deltaPercent.toFixed(1)}%`,
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
        />
      </ChartCard>
    </PageShell>
  )
}
