"use client"

import { useEffect } from "react"

import { ErrorState } from "@/components/states/error-state"

/**
 * Error boundary for every dashboard route.
 *
 * Catching here rather than at the app root keeps the sidebar and header
 * rendered, so a failing page does not blank the whole shell.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // In production this goes to Sentry or an equivalent. `error.message` is
    // already redacted by Next.js on the client for server-thrown errors; the
    // digest is the handle for correlating with the server log.
    console.error("[dashboard] Route error:", error)
  }, [error])

  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <ErrorState
          title="This page failed to load"
          description="The dashboard is still running — only this view failed. Retrying usually resolves it."
          onRetry={reset}
          reference={error.digest}
        />
      </div>
    </main>
  )
}
