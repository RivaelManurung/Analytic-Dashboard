import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Engagement rate",
  description: "Interactions per impression, the normalised measure of resonance.",
}

export default async function Page(props: PageProps<"/engagement-rate">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="engagementRate" searchParams={searchParams} />
}
