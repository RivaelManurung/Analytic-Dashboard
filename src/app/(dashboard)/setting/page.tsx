import type { Metadata } from "next"

import { PageShell } from "@/components/dashboard/page-shell"
import { SettingsForm } from "@/components/workspace/settings-form"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Settings",
  description: "Workspace preferences, defaults, and data handling.",
}

export default async function SettingPage() {
  const user = await getSession()
  if (!user) redirect("/login")

  return (
    <PageShell
      title="Settings"
      description="Preferences that apply to this workspace and everyone in it."
    >
      <SettingsForm user={user} />
    </PageShell>
  )
}
