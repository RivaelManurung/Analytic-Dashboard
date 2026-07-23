"use client"

import { useActionState } from "react"
import Link from "next/link"

import { AuthPasswordField } from "@/components/auth/form-field"
import { FormMessage, SubmitButton } from "@/components/auth/form-status"
import { resetPasswordAction } from "@/lib/auth/actions"
import { initialActionState } from "@/lib/auth/action-state"

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialActionState)

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <FormMessage state={state} />
        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue to sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />

      {/* The token travels with the submission rather than being re-read from
          the URL by the action, which keeps the action independent of routing. */}
      <input type="hidden" name="token" value={token} />

      <AuthPasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        placeholder="••••••••••••"
        required
        hint="At least 12 characters."
        errors={state.fieldErrors?.password}
      />

      <AuthPasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="••••••••••••"
        required
        errors={state.fieldErrors?.confirmPassword}
      />

      <SubmitButton>Update password</SubmitButton>
    </form>
  )
}
