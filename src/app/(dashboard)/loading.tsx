import { PageSkeleton } from "@/components/states/skeletons"

/**
 * Streaming fallback for dashboard routes.
 *
 * Each block reserves the height of the content it stands in for, so the real
 * page does not shift the layout when it arrives.
 */
export default function DashboardLoading() {
  return <PageSkeleton />
}
