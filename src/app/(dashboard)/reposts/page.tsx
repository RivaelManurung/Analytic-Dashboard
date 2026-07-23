import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Reposts",
  description: "Monitor how often your content is shared onward.",
}

export default async function Page(props: PageProps<"/reposts">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="reposts" searchParams={searchParams} />
}
