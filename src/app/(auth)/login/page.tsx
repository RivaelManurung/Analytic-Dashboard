import type { Metadata } from "next"
import Link from "next/link"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your analytics workspace.",
  // A login page has no business being indexed.
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to pick up where your numbers left off.
        </p>
      </header>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-foreground hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
