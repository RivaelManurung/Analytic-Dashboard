"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAnalyticsFilters } from "@/hooks/use-analytics-filters"

type Dataset = "posts" | "summaries"

export function ExportButton() {
  const { filters } = useAnalyticsFilters()
  const [pending, setPending] = useState(false)

  const download = async (dataset: Dataset) => {
    setPending(true)

    try {
      const params = new URLSearchParams({ period: filters.period, dataset })
      if (filters.from) params.set("from", filters.from)
      if (filters.to) params.set("to", filters.to)

      const response = await fetch(`/api/analytics/export?${params}`)

      if (!response.ok) {
        // The server sends a generic message; surface that rather than a status code.
        const body = await response.json().catch(() => null)
        throw new Error(body?.error?.message ?? "The export failed.")
      }

      const blob = await response.blob()

      // Filename comes from Content-Disposition, which the server sanitises.
      const disposition = response.headers.get("Content-Disposition") ?? ""
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "export.csv"

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      anchor.click()
      // Without this the blob is retained for the lifetime of the document.
      URL.revokeObjectURL(url)

      toast.success("Export ready", { description: filename })
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="sm"
            disabled={pending}
            aria-busy={pending}
            className="h-9 rounded-xl px-3 text-xs font-semibold"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Download className="size-3.5" aria-hidden />
            )}
            <span className="hidden sm:inline">Export</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void download("summaries")}>
          Metric summary (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void download("posts")}>
          Post performance (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
