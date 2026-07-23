"use client"

import { useActionState } from "react"

import { AuthField } from "@/components/auth/form-field"
import { FormMessage, SubmitButton } from "@/components/auth/form-status"
import { forgotPasswordAction } from "@/lib/auth/actions"
import { initialActionState } from "@/lib/auth/action-state"

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialActionState)

  // On success the form is replaced rather than left filled in: re-submitting
  // the same address does nothing useful and invites repeat clicks.
  if (state.status === "success") {
    return <FormMessage state={state} />
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />

      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
        errors={state.fieldErrors?.email}
      />

      <SubmitButton>Send reset link</SubmitButton>
    </form>
  )
}
