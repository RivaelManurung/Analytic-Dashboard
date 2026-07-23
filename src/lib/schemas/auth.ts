import { z } from "zod"

/**
 * Roles, ordered from least to most privileged. The array order is the
 * hierarchy — `hasRole` compares indices, so inserting a role in the middle
 * changes permissions everywhere by design.
 */
export const ROLES = ["viewer", "analyst", "admin", "owner"] as const

export const roleSchema = z.enum(ROLES)
export type Role = z.infer<typeof roleSchema>

export const ROLE_LABELS: Record<Role, string> = {
  viewer: "Viewer",
  analyst: "Analyst",
  admin: "Admin",
  owner: "Owner",
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  viewer: "Can read dashboards. Cannot export or change anything.",
  analyst: "Can read dashboards and export data.",
  admin: "Can manage team members and integrations.",
  owner: "Full access, including billing and workspace deletion.",
}

/** True when `role` is at least as privileged as `required`. */
export function hasRole(role: Role, required: Role): boolean {
  return ROLES.indexOf(role) >= ROLES.indexOf(required)
}

/* -------------------------------------------------------------------------- */
/* Credentials                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Normalise BEFORE validating.
 *
 * Zod runs the chain in order, so an `.email()` placed before the transform
 * would reject "  user@example.com " outright — a trailing space from a paste
 * or autofill would read to the user as "invalid email address".
 */
const email = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.string().email("Enter a valid email address"))

/**
 * Password policy follows NIST SP 800-63B: length is the primary control.
 * Composition rules (one upper, one symbol…) are deliberately not enforced —
 * they push users toward predictable substitutions without adding entropy.
 */
const password = z.string().min(12, "Use at least 12 characters").max(128, "Password is too long")

export const loginSchema = z.object({
  email,
  // Existing passwords are only checked for presence: a length rule here would
  // leak the policy and reject legitimate legacy credentials.
  password: z.string().min(1, "Password is required"),
  rememberMe: z.coerce.boolean().default(false),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name").max(80, "Name is too long").trim(),
    email,
    password,
    confirmPassword: z.string(),
    acceptTerms: z.coerce
      .boolean()
      .refine((value) => value, "You must accept the terms to continue"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type RegisterInput = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({ email })
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing"),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

export const sessionUserSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: roleSchema,
  workspace: z.string(),
  avatarUrl: z.string().nullable(),
})
export type SessionUser = z.infer<typeof sessionUserSchema>
