import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Replies",
  description: "Measure conversation volume and response activity.",
}

export default async function Page(props: PageProps<"/replies">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="replies" searchParams={searchParams} />
}
