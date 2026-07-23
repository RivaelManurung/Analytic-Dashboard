"use client"

import { useActionState } from "react"
import Link from "next/link"

import { AuthField, AuthPasswordField } from "@/components/auth/form-field"
import { FormMessage, SubmitButton } from "@/components/auth/form-status"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { registerAction } from "@/lib/auth/actions"
import { initialActionState } from "@/lib/auth/action-state"

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialActionState)

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />

      <AuthField
        label="Full name"
        name="name"
        autoComplete="name"
        placeholder="Farhan Ramadhan"
        required
        errors={state.fieldErrors?.name}
      />

      <AuthField
        label="Work email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
        errors={state.fieldErrors?.email}
      />

      <AuthPasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="••••••••••••"
        required
        hint="At least 12 characters. Length beats symbols."
        errors={state.fieldErrors?.password}
      />

      <AuthPasswordField
        label="Confirm password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="••••••••••••"
        required
        errors={state.fieldErrors?.confirmPassword}
      />

      <div className="space-y-1.5">
        <Label
          htmlFor="acceptTerms"
          className="flex items-start gap-2.5 text-sm font-normal text-muted-foreground"
        >
          <Checkbox id="acceptTerms" name="acceptTerms" className="mt-0.5" />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-foreground hover:underline">
              terms of service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-foreground hover:underline">
              privacy policy
            </Link>
            .
          </span>
        </Label>
        {state.fieldErrors?.acceptTerms && (
          <p role="alert" className="text-sm text-destructive">
            {state.fieldErrors.acceptTerms[0]}
          </p>
        )}
      </div>

      <SubmitButton>Create account</SubmitButton>
    </form>
  )
}
