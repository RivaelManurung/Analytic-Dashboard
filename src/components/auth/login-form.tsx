"use client"

import { useActionState } from "react"
import Link from "next/link"

import { AuthField, AuthPasswordField } from "@/components/auth/form-field"
import { FormMessage, SubmitButton } from "@/components/auth/form-status"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/lib/auth/actions"
import { initialActionState } from "@/lib/auth/action-state"

const DEMO_ACCOUNTS = [
  { role: "Owner", email: "owner@visiora.app", password: "demo-password-owner" },
  { role: "Analyst", email: "analyst@visiora.app", password: "demo-password-analyst" },
  { role: "Viewer", email: "viewer@visiora.app", password: "demo-password-viewer" },
]

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialActionState)

  return (
    <div className="space-y-6">
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

        <AuthPasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          required
          errors={state.fieldErrors?.password}
        />

        <div className="flex items-center justify-between">
          <Label htmlFor="rememberMe" className="flex items-center gap-2 text-sm font-normal">
            <Checkbox id="rememberMe" name="rememberMe" />
            Keep me signed in
          </Label>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>

        <SubmitButton>Sign in</SubmitButton>
      </form>

      {/* Demo credentials are shown deliberately: this is a starter kit with a
          mock user store and no real accounts to protect. Delete this block
          when wiring a real identity provider. */}
      <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/40 p-4">
        <p className="text-micro font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Demo accounts
        </p>
        <ul className="space-y-1.5">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email} className="flex items-baseline justify-between gap-3 text-xs">
              <span className="shrink-0 font-medium text-muted-foreground">{account.role}</span>
              <code className="truncate font-mono text-foreground/80">{account.email}</code>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Password: <code className="font-mono">demo-password-&lt;role&gt;</code>
        </p>
      </div>
    </div>
  )
}
