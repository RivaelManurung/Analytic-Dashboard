import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Profile visits",
  description: "See how much traffic reaches your profile and where it comes from.",
}

export default async function Page(props: PageProps<"/profile-visits">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="profileVisits" searchParams={searchParams} />
}
