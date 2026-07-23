"use client"

import { useEffect } from "react"

/**
 * Last-resort boundary, for failures in the root layout itself.
 *
 * This replaces the entire document, so it must render its own <html> and
 * <body> — the root layout is exactly what has failed. For the same reason it
 * cannot use the app's providers, fonts, or components, so the styling is
 * inline and deliberately dependency-free.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app] Fatal error:", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#f7f7f8",
          color: "#17171a",
        }}
      >
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
            Something went badly wrong
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#52514e",
              margin: "0 0 1.5rem",
            }}
          >
            The application failed to start. This is not something you can fix from here — please
            try again, and quote the reference below if it keeps happening.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#17171a",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload the application
          </button>

          {error.digest && (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#8a8a85" }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
