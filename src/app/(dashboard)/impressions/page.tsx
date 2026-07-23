import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Impressions",
  description: "Measure how often your content was rendered on screen.",
}

export default async function Page(props: PageProps<"/impressions">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="impressions" searchParams={searchParams} />
}
