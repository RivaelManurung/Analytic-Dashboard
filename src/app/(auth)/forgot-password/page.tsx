import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a password reset link.",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email you signed up with and we&apos;ll send a reset link.
        </p>
      </header>

      <ForgotPasswordForm />

      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to sign in
      </Link>
    </div>
  )
}
