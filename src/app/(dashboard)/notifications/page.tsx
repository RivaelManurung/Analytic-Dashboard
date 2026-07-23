import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Bell, CheckCircle2, Info, TriangleAlert } from "lucide-react"

import { PageShell } from "@/components/dashboard/page-shell"
import { EmptyState } from "@/components/states/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/auth/session"
import { NOTIFICATIONS, type NotificationItem } from "@/lib/data/workspace"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Notifications",
  description: "Alerts, digests, and things that need your attention.",
}

const SEVERITY = {
  info: { icon: Info, className: "bg-info-muted text-info", label: "Info" },
  success: { icon: CheckCircle2, className: "bg-positive-muted text-positive", label: "Good news" },
  warning: {
    icon: TriangleAlert,
    className: "bg-warning-muted text-warning",
    label: "Needs attention",
  },
} as const

export default async function NotificationsPage() {
  const user = await getSession()
  if (!user) redirect("/login")

  const unread = NOTIFICATIONS.filter((item) => !item.read)
  const read = NOTIFICATIONS.filter((item) => item.read)

  return (
    <PageShell
      title="Notifications"
      description="Alerts about your metrics, integrations, and workspace."
      actions={
        unread.length > 0 && (
          <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-semibold">
            Mark all as read
          </Button>
        )
      }
    >
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          Unread
          {unread.length > 0 && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {unread.length}
            </Badge>
          )}
        </h2>

        {unread.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="New alerts about your metrics and integrations will land here."
          />
        ) : (
          <ul className="space-y-3">
            {unread.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      {read.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Earlier</h2>
          <ul className="space-y-3">
            {read.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  )
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const severity = SEVERITY[item.severity]
  const Icon = severity.icon

  return (
    <li
      className={cn(
        "flex gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm",
        item.read && "opacity-70"
      )}
    >
      <span
        className={cn("grid size-10 shrink-0 place-items-center rounded-xl", severity.className)}
      >
        <Icon className="size-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">{item.title}</h3>
          <time className="shrink-0 text-xs text-muted-foreground">{item.at}</time>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
        {/* Category is stated in text, not conveyed by the icon colour alone. */}
        <span className="sr-only">Category: {severity.label}.</span>
      </div>

      {!item.read && (
        <span
          aria-hidden
          className="mt-1.5 size-2 shrink-0 self-start rounded-full bg-info"
          title="Unread"
        />
      )}
    </li>
  )
}
