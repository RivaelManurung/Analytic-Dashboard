import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Shares",
  description: "Track how often your content is sent directly to someone.",
}

export default async function Page(props: PageProps<"/shares">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="shares" searchParams={searchParams} />
}
