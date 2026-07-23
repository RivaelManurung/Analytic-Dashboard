"use client"

import { RefreshCw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  description?: string
  /** Wire to a Next.js `reset()` or a refetch. Omit to hide the button. */
  onRetry?: () => void
  /** Digest or error id, shown so a user can quote it in a support request. */
  reference?: string
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. It's usually temporary — try again.",
  onRetry,
  reference,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/25 bg-negative-muted px-6 py-12 text-center",
        className
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" aria-hidden />
      </span>

      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1 rounded-xl">
          <RefreshCw className="size-3.5" aria-hidden />
          Try again
        </Button>
      )}

      {/* Only an opaque reference is shown. The underlying message can carry
          file paths or connection details and must not reach the browser. */}
      {reference && (
        <p className="font-mono text-[11px] text-muted-foreground/70">Reference: {reference}</p>
      )}
    </div>
  )
}
