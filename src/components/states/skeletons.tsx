import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading placeholders.
 *
 * Each one reserves the exact height of the content it replaces. A skeleton
 * that is the wrong size causes a layout shift when the real content arrives,
 * which is the thing a skeleton exists to prevent.
 */

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full rounded-xl" style={{ height }} />
}

export function MetricCardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function MetricGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: count }, (_, index) => (
        <MetricCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function ChartCardSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <ChartSkeleton height={height} />
    </div>
  )
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border/70 rounded-2xl border border-border/70">
      <div className="bg-muted/40 p-3.5">
        <Skeleton className="h-3.5 w-32" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 p-3.5">
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  )
}

/** Full-page fallback, used by route-level `loading.tsx`. */
export function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-6 md:px-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>
      <MetricGridSkeleton />
      <ChartCardSkeleton height={320} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton height={220} />
        <ChartCardSkeleton height={220} />
      </div>
    </div>
  )
}
