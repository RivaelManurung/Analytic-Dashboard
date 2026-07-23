"use client"

import { useId, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { AuthPasswordField } from "@/components/auth/form-field"
import type { SessionUser } from "@/lib/schemas/auth"

export function ProfileForm({ user }: { user: SessionUser }) {
  const [saving, setSaving] = useState(false)
  const nameId = useId()
  const emailId = useId()
  const bioId = useId()

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    // Demo only. A real build posts to a Server Action that re-validates the
    // payload and confirms the caller owns this record before writing.
    window.setTimeout(() => {
      setSaving(false)
      toast.success("Profile updated")
    }, 500)
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={save}
        className="space-y-5 rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
      >
        <div>
          <h2 className="text-base font-semibold tracking-tight">Personal details</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            This is what your teammates see next to your activity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>Full name</Label>
            <Input
              id={nameId}
              name="name"
              defaultValue={user.name}
              autoComplete="name"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              name="email"
              type="email"
              defaultValue={user.email}
              autoComplete="email"
              aria-describedby={`${emailId}-hint`}
              className="h-10 rounded-xl"
            />
            <p id={`${emailId}-hint`} className="text-xs text-muted-foreground">
              Changing this sends a confirmation link to the new address.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={bioId}>Bio</Label>
          <Textarea
            id={bioId}
            name="bio"
            rows={3}
            placeholder="A sentence about what you do here."
            className="rounded-xl"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} aria-busy={saving} className="rounded-xl">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          toast.success("Password updated")
        }}
        className="space-y-5 rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
      >
        <div>
          <h2 className="text-base font-semibold tracking-tight">Password</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Changing your password signs out every other device.
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <AuthPasswordField
            label="Current password"
            name="currentPassword"
            autoComplete="current-password"
            required
          />
          <AuthPasswordField
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            hint="At least 12 characters. Length beats symbols."
            required
          />
          <AuthPasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="outline" className="rounded-xl">
            Update password
          </Button>
        </div>
      </form>
    </div>
  )
}
