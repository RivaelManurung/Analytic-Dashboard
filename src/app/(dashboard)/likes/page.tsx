import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Likes",
  description: "Track likes across channels and identify what resonates.",
}

export default async function Page(props: PageProps<"/likes">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="likes" searchParams={searchParams} />
}
