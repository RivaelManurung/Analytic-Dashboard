import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Engagement",
  description: "Total interactions across likes, replies, reposts, bookmarks, and shares.",
}

export default async function Page(props: PageProps<"/engagement">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="engagement" searchParams={searchParams} />
}
