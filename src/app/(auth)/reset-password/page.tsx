import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your account.",
  robots: { index: false, follow: false },
}

// Next 16: `searchParams` is a Promise and must be awaited.
export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const { token } = await props.searchParams

  // Only ever a single token; an array here means a malformed or crafted URL.
  const resetToken = typeof token === "string" ? token : ""

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose something long. Length protects you far more than symbols do.
        </p>
      </header>

      {resetToken ? (
        <ResetPasswordForm token={resetToken} />
      ) : (
        <div
          role="alert"
          className="rounded-xl bg-negative-muted px-3 py-2.5 text-sm text-destructive"
        >
          This reset link is missing its token. Request a new one from the{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            forgot password
          </Link>{" "}
          page.
        </div>
      )}

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
