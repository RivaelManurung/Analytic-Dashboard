"use client"

import { useId, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { hasRole, type SessionUser } from "@/lib/schemas/auth"

interface ToggleSetting {
  id: string
  label: string
  description: string
  defaultOn: boolean
}

const NOTIFICATION_SETTINGS: ToggleSetting[] = [
  {
    id: "weekly-digest",
    label: "Weekly digest",
    description: "A Monday summary of last week's headline metrics.",
    defaultOn: true,
  },
  {
    id: "threshold-alerts",
    label: "Threshold alerts",
    description: "Notify me when a metric moves more than 20% week over week.",
    defaultOn: true,
  },
  {
    id: "sync-failures",
    label: "Sync failures",
    description: "Notify me when an integration stops importing data.",
    defaultOn: true,
  },
  {
    id: "product-updates",
    label: "Product updates",
    description: "Occasional emails about new features.",
    defaultOn: false,
  },
]

const DISPLAY_SETTINGS: ToggleSetting[] = [
  {
    id: "compact-numbers",
    label: "Compact numbers",
    description: "Show 2.1M instead of 2,132,435 on cards and axes.",
    defaultOn: true,
  },
  {
    id: "show-comparison",
    label: "Always compare to previous period",
    description: "Overlay the preceding window on every trend chart by default.",
    defaultOn: false,
  },
  {
    id: "reduce-motion",
    label: "Reduce motion",
    description: "Disable chart and card animations regardless of the OS setting.",
    defaultOn: false,
  },
]

export function SettingsForm({ user }: { user: SessionUser }) {
  const [saving, setSaving] = useState(false)
  const workspaceId = useId()
  const timezoneId = useId()
  const currencyId = useId()

  const canEditWorkspace = hasRole(user.role, "admin")

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    // Demo only — a real build posts to a Server Action that re-validates the
    // payload and re-checks the caller's role before writing anything.
    window.setTimeout(() => {
      setSaving(false)
      toast.success("Settings saved", { description: "Your preferences have been updated." })
    }, 500)
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <fieldset
        disabled={!canEditWorkspace}
        className="space-y-5 rounded-2xl border border-border/70 bg-card p-6 shadow-sm disabled:opacity-70"
      >
        <legend className="sr-only">Workspace</legend>
        <div>
          <h2 className="text-base font-semibold tracking-tight">Workspace</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {canEditWorkspace
              ? "Applies to everyone in this workspace."
              : "Only admins and owners can change these."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={workspaceId}>Workspace name</Label>
            <Input
              id={workspaceId}
              name="workspace"
              defaultValue={user.workspace}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={timezoneId}>Reporting timezone</Label>
            <NativeSelect id={timezoneId} name="timezone" defaultValue="Asia/Jakarta">
              <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              <option value="Europe/London">Europe/London (GMT+1)</option>
              <option value="America/New_York">America/New_York (GMT−4)</option>
              <option value="UTC">UTC</option>
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              Day boundaries in every chart are drawn in this timezone.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={currencyId}>Revenue currency</Label>
            <NativeSelect id={currencyId} name="currency" defaultValue="USD">
              <option value="USD">USD — US Dollar</option>
              <option value="IDR">IDR — Indonesian Rupiah</option>
              <option value="SGD">SGD — Singapore Dollar</option>
              <option value="EUR">EUR — Euro</option>
            </NativeSelect>
          </div>
        </div>
      </fieldset>

      <SettingsSection
        title="Notifications"
        description="Where and when we should interrupt you."
        settings={NOTIFICATION_SETTINGS}
      />

      <SettingsSection
        title="Display"
        description="How figures and charts are presented for your account."
        settings={DISPLAY_SETTINGS}
      />

      <div className="space-y-4 rounded-2xl border border-destructive/25 bg-negative-muted p-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-destructive">Danger zone</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Deleting a workspace removes every metric, report, and integration. This cannot be
            undone.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="rounded-xl"
          disabled={!hasRole(user.role, "owner")}
        >
          Delete workspace
        </Button>
        {!hasRole(user.role, "owner") && (
          <p className="text-xs text-muted-foreground">Only the workspace owner can do this.</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="rounded-xl">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} aria-busy={saving} className="rounded-xl">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}

function SettingsSection({
  title,
  description,
  settings,
}: {
  title: string
  description: string
  settings: ToggleSetting[]
}) {
  return (
    <fieldset className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <legend className="sr-only">{title}</legend>
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="mt-5 space-y-1">
        {settings.map((setting, index) => (
          <div key={setting.id}>
            {index > 0 && <Separator className="my-1" />}
            <div className="flex items-start justify-between gap-6 py-3">
              <div className="min-w-0">
                <Label htmlFor={setting.id} className="text-sm font-medium">
                  {setting.label}
                </Label>
                <p
                  id={`${setting.id}-description`}
                  className="mt-0.5 text-xs leading-relaxed text-muted-foreground"
                >
                  {setting.description}
                </p>
              </div>
              <Switch
                id={setting.id}
                name={setting.id}
                defaultChecked={setting.defaultOn}
                aria-describedby={`${setting.id}-description`}
              />
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
