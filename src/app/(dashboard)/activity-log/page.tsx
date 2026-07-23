import type { Metadata } from "next"
import { forbidden } from "next/navigation"

import { PageShell } from "@/components/dashboard/page-shell"
import { ActivityTable } from "@/components/workspace/activity-table"
import { StatStrip } from "@/components/workspace/stat-strip"
import { requireRole } from "@/lib/auth/session"
import { ACTIVITY_LOG } from "@/lib/data/workspace"

export const metadata: Metadata = {
  title: "Activity log",
  description: "An audit trail of every action taken in this workspace.",
}

export default async function ActivityLogPage() {
  const session = await requireRole("admin")
  if (!session) forbidden()

  const byCategory = (category: string) =>
    ACTIVITY_LOG.filter((entry) => entry.category === category).length

  return (
    <PageShell
      title="Activity log"
      description="Who did what, when, and from where. Retained for 24 months on the Scale plan."
    >
      <StatStrip
        stats={[
          { label: "Events (30 days)", value: String(ACTIVITY_LOG.length) },
          { label: "Data exports", value: String(byCategory("data")), tone: "warning" },
          { label: "Team changes", value: String(byCategory("team")) },
          { label: "Sign-ins", value: String(byCategory("auth")) },
        ]}
      />

      <ActivityTable entries={ACTIVITY_LOG} />
    </PageShell>
  )
}
