import type { Metadata } from "next"
import { forbidden } from "next/navigation"
import { CheckCircle2, Plug, RefreshCw } from "lucide-react"

import { PageShell } from "@/components/dashboard/page-shell"
import { StatStrip } from "@/components/workspace/stat-strip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth/session"
import { INTEGRATIONS, type Integration } from "@/lib/data/workspace"

export const metadata: Metadata = {
  title: "Integrations",
  description: "Connect the channels and tools that feed your dashboard.",
}

export default async function IntegrationPage() {
  const session = await requireRole("admin")
  if (!session) forbidden()

  const connected = INTEGRATIONS.filter((item) => item.connected)
  const categories = [...new Set(INTEGRATIONS.map((item) => item.category))]

  return (
    <PageShell
      title="Integrations"
      description="Every metric on this dashboard originates from a connected source. Disconnected channels silently leave gaps in your reports."
    >
      <StatStrip
        stats={[
          { label: "Connected", value: String(connected.length), tone: "positive" },
          {
            label: "Available",
            value: String(INTEGRATIONS.length - connected.length),
          },
          { label: "Categories", value: String(categories.length) },
          { label: "Last sync", value: "08:12", hint: "Shopify, 23 Jul 2026" },
        ]}
      />

      {categories.map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">{category}</h2>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {INTEGRATIONS.filter((item) => item.category === category).map((item) => (
              <IntegrationCard key={item.id} integration={item} />
            ))}
          </ul>
        </section>
      ))}
    </PageShell>
  )
}

function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
          <Plug className="size-4" aria-hidden />
        </span>

        {integration.connected ? (
          <Badge
            variant="secondary"
            className="rounded-full bg-positive-muted text-xs text-positive"
          >
            <CheckCircle2 className="size-3" aria-hidden />
            Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="rounded-full text-xs">
            Not connected
          </Badge>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold">{integration.name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {integration.description}
        </p>
        {integration.accountLabel && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">{integration.accountLabel}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">
          {integration.lastSyncedAt ? `Synced ${integration.lastSyncedAt}` : "Never synced"}
        </span>
        <Button
          variant={integration.connected ? "outline" : "default"}
          size="sm"
          className="h-8 rounded-lg text-xs"
        >
          {integration.connected && <RefreshCw className="size-3" aria-hidden />}
          {integration.connected ? "Sync" : "Connect"}
        </Button>
      </div>
    </li>
  )
}
