"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"

import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit"
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session"
import { createUser, findUserByEmail, toSessionUser, verifyPassword } from "@/lib/auth/users"
import type { ActionState } from "@/lib/auth/action-state"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/schemas/auth"


/**
 * Rate-limit key for credential endpoints.
 *
 * `x-forwarded-for` is only trustworthy behind a proxy that overwrites it
 * (Vercel, Cloudflare, an ingress you control). On a direct-to-Node deployment
 * a client can forge it, so this must not be the only brute-force control.
 */
async function credentialKey(scope: string): Promise<string> {
  const headerList = await headers()
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  return `${scope}:${ip}`
}

function fieldErrorsFrom(error: {
  issues: { path: PropertyKey[]; message: string }[]
}): Record<string, string[]> {
  const fields: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_root"
    fields[key] = [...(fields[key] ?? []), issue.message]
  }
  return fields
}

/* -------------------------------------------------------------------------- */
/* Login                                                                      */
/* -------------------------------------------------------------------------- */

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limit = checkRateLimit(await credentialKey("login"), RATE_LIMITS.auth)
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many sign-in attempts. Try again in ${limit.retryAfter}s.`,
    }
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const user = await findUserByEmail(parsed.data.email)

  // Always run the hash comparison, even when the account does not exist.
  // Returning early on an unknown email makes the response measurably faster
  // and turns the form into an account-enumeration oracle.
  const passwordOk = user
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : await verifyPassword(parsed.data.password, "scrypt$00$00")

  if (!user || !passwordOk) {
    // One generic message for both cases, for the same reason.
    return { status: "error", message: "Incorrect email or password." }
  }

  await setSessionCookie(toSessionUser(user), parsed.data.rememberMe)

  // `redirect` throws internally, so nothing after it runs.
  redirect("/")
}

/* -------------------------------------------------------------------------- */
/* Register                                                                   */
/* -------------------------------------------------------------------------- */

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limit = checkRateLimit(await credentialKey("register"), RATE_LIMITS.auth)
  if (!limit.success) {
    return { status: "error", message: "Too many attempts. Please try again shortly." }
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms") === "on",
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const existing = await findUserByEmail(parsed.data.email)
  if (existing) {
    // Deliberately vague: confirming the address is taken enumerates accounts.
    // A production build would send a "you already have an account" email here.
    return {
      status: "success",
      message: "Check your inbox to finish setting up your account.",
    }
  }

  const user = await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
  })

  await setSessionCookie(toSessionUser(user))
  redirect("/")
}

/* -------------------------------------------------------------------------- */
/* Password reset                                                             */
/* -------------------------------------------------------------------------- */

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const limit = checkRateLimit(await credentialKey("forgot"), RATE_LIMITS.auth)
  if (!limit.success) {
    return { status: "error", message: "Too many requests. Please try again shortly." }
  }

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  // Identical response whether or not the account exists — anything else
  // turns this form into an account-enumeration oracle.
  return {
    status: "success",
    message: "If an account exists for that address, a reset link is on its way.",
  }
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const limit = checkRateLimit(await credentialKey("reset"), RATE_LIMITS.auth)
  if (!limit.success) {
    return { status: "error", message: "Too many requests. Please try again shortly." }
  }

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  // A real implementation verifies a single-use, expiring, hashed token here
  // and only then writes the new password hash.
  return {
    status: "success",
    message: "Your password has been updated. You can now sign in.",
  }
}

/* -------------------------------------------------------------------------- */
/* Logout                                                                     */
/* -------------------------------------------------------------------------- */

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  redirect("/login")
}
