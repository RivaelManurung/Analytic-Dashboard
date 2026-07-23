import type { Metadata } from "next"
import { forbidden } from "next/navigation"
import { UserPlus } from "lucide-react"

import { PageShell } from "@/components/dashboard/page-shell"
import { Button } from "@/components/ui/button"
import { TeamTable } from "@/components/workspace/team-table"
import { StatStrip } from "@/components/workspace/stat-strip"
import { requireRole } from "@/lib/auth/session"
import { TEAM_MEMBERS } from "@/lib/data/workspace"
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES } from "@/lib/schemas/auth"

export const metadata: Metadata = {
  title: "Team",
  description: "Manage workspace members, roles, and access.",
}

export default async function TeamManagementPage() {
  // The nav already hides this page below admin, but hiding a link is not a
  // control — anyone can type the URL. This is the check that actually holds.
  const session = await requireRole("admin")
  if (!session) forbidden()

  const active = TEAM_MEMBERS.filter((member) => member.status === "active").length
  const invited = TEAM_MEMBERS.filter((member) => member.status === "invited").length
  const suspended = TEAM_MEMBERS.filter((member) => member.status === "suspended").length

  return (
    <PageShell
      title="Team"
      description="Who has access to this workspace, and what they can do with it."
      actions={
        <Button size="sm" className="h-9 rounded-xl text-xs font-semibold">
          <UserPlus className="size-3.5" aria-hidden />
          Invite member
        </Button>
      }
    >
      <StatStrip
        stats={[
          { label: "Total members", value: String(TEAM_MEMBERS.length) },
          { label: "Active", value: String(active), tone: "positive" },
          { label: "Pending invites", value: String(invited), tone: "warning" },
          { label: "Suspended", value: String(suspended), tone: "negative" },
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Members</h2>
        <TeamTable members={TEAM_MEMBERS} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">What each role can do</h2>
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role) => (
            <div key={role} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <dt className="text-sm font-semibold">{ROLE_LABELS[role]}</dt>
              <dd className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {ROLE_DESCRIPTIONS[role]}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </PageShell>
  )
}
