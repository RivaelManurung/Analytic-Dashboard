import type { Metadata } from "next"
import Link from "next/link"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your analytics workspace.",
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">Create your workspace</h1>
        <p className="text-sm text-muted-foreground">
          Start tracking every channel in one place. No card required.
        </p>
      </header>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
