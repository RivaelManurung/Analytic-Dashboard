import type { Metadata } from "next"
import { forbidden } from "next/navigation"
import { Plus } from "lucide-react"

import { PageShell } from "@/components/dashboard/page-shell"
import { StatStrip } from "@/components/workspace/stat-strip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth/session"
import { SAVED_REPORTS } from "@/lib/data/workspace"

export const metadata: Metadata = {
  title: "Reports",
  description: "Saved and scheduled reports for your workspace.",
}

const SCHEDULE_STYLE: Record<string, string> = {
  Daily: "bg-info-muted text-info",
  Weekly: "bg-positive-muted text-positive",
  Monthly: "bg-warning-muted text-warning",
  Manual: "bg-muted text-muted-foreground",
}

export default async function ReportsPage() {
  // Reports egress data, so viewers cannot reach this page.
  const session = await requireRole("analyst")
  if (!session) forbidden()

  const scheduled = SAVED_REPORTS.filter((report) => report.schedule !== "Manual")
  const recipients = SAVED_REPORTS.reduce((sum, report) => sum + report.recipients, 0)

  return (
    <PageShell
      title="Reports"
      description="Recurring exports and digests, delivered without anyone having to open the dashboard."
      actions={
        <Button size="sm" className="h-9 rounded-xl text-xs font-semibold">
          <Plus className="size-3.5" aria-hidden />
          New report
        </Button>
      }
    >
      <StatStrip
        stats={[
          { label: "Saved reports", value: String(SAVED_REPORTS.length) },
          { label: "On a schedule", value: String(scheduled.length), tone: "positive" },
          { label: "Total recipients", value: String(recipients) },
          { label: "Last delivery", value: "23 Jul", hint: "Raw post export" },
        ]}
      />

      <ul className="grid gap-4 md:grid-cols-2">
        {SAVED_REPORTS.map((report) => (
          <li
            key={report.id}
            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-colors hover:border-border"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">{report.name}</h2>
              <Badge
                variant="secondary"
                className={`shrink-0 rounded-full text-xs ${SCHEDULE_STYLE[report.schedule] ?? ""}`}
              >
                {report.schedule}
              </Badge>
            </div>

            <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
              {report.description}
            </p>

            <dl className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <dt className="font-medium">Format</dt>
                <dd className="text-foreground">{report.format}</dd>
              </div>
              <div>
                <dt className="font-medium">Recipients</dt>
                <dd className="tabular-figures text-foreground">{report.recipients}</dd>
              </div>
              <div>
                <dt className="font-medium">Last run</dt>
                <dd className="text-foreground">{report.lastRunAt}</dd>
              </div>
            </dl>

            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">Owner: {report.owner}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                  Edit
                </Button>
                <Button size="sm" className="h-8 rounded-lg text-xs">
                  Run now
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
