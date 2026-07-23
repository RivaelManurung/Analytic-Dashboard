import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Posts",
  description: "Review every published post and its performance.",
}

export default async function Page(props: PageProps<"/posts">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="posts" searchParams={searchParams} />
}
