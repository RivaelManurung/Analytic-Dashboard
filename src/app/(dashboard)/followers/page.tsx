import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Followers",
  description: "Track follower growth, churn, and net adds across every channel.",
}

export default async function Page(props: PageProps<"/followers">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="followers" searchParams={searchParams} />
}
