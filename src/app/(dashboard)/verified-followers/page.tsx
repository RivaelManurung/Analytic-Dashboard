import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Verified followers",
  description: "Monitor the verified share of your audience as a quality signal.",
}

export default async function Page(props: PageProps<"/verified-followers">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="verifiedFollowers" searchParams={searchParams} />
}
