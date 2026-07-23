import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { PageShell } from "@/components/dashboard/page-shell"
import { ProfileForm } from "@/components/workspace/profile-form"
import { Badge } from "@/components/ui/badge"
import { getSession } from "@/lib/auth/session"
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/schemas/auth"

export const metadata: Metadata = {
  title: "Profile",
  description: "Your account details and security.",
}

export default async function ProfilePage() {
  const user = await getSession()
  if (!user) redirect("/login")

  return (
    <PageShell title="Profile" description="Your personal details, session, and security settings.">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ProfileForm user={user} />

        <aside className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold tracking-tight">Your access</h2>
            <div className="space-y-1.5">
              <Badge variant="outline" className="rounded-full">
                {ROLE_LABELS[user.role]}
              </Badge>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {ROLE_DESCRIPTIONS[user.role]}
              </p>
            </div>
            <dl className="space-y-2.5 border-t pt-4 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Workspace</dt>
                <dd className="font-medium">{user.workspace}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="font-mono">{user.userId}</dd>
              </div>
            </dl>
            <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              Only an admin or the workspace owner can change your role. Ask one of them if you need
              different access.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold tracking-tight">Active sessions</h2>
            <div className="space-y-1">
              <p className="text-sm font-medium">This device</p>
              <p className="text-xs text-muted-foreground">
                Signed in via password. The session cookie is httpOnly and expires after 24 hours,
                or 30 days if you chose &ldquo;keep me signed in&rdquo;.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
