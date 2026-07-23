import type { Metadata } from "next"

import { MetricDetailView } from "@/components/dashboard/metric-detail-view"

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Saves are the strongest signal that content has lasting value.",
}

export default async function Page(props: PageProps<"/bookmarks">) {
  const searchParams = await props.searchParams

  return <MetricDetailView metricKey="bookmarks" searchParams={searchParams} />
}
