import { describe, expect, test } from "vitest"

import {
  forgotPasswordSchema,
  hasRole,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  ROLES,
} from "@/lib/schemas/auth"

describe("hasRole", () => {
  test("grants access at the exact required role", () => {
    expect(hasRole("admin", "admin")).toBe(true)
  })

  test("grants access to a more privileged role", () => {
    expect(hasRole("owner", "admin")).toBe(true)
    expect(hasRole("admin", "viewer")).toBe(true)
  })

  test("denies access to a less privileged role", () => {
    // This is the check that keeps a viewer out of billing and exports.
    expect(hasRole("viewer", "analyst")).toBe(false)
    expect(hasRole("analyst", "admin")).toBe(false)
    expect(hasRole("admin", "owner")).toBe(false)
  })

  test("orders the whole hierarchy consistently", () => {
    for (let i = 0; i < ROLES.length; i += 1) {
      for (let j = 0; j < ROLES.length; j += 1) {
        expect(hasRole(ROLES[i]!, ROLES[j]!)).toBe(i >= j)
      }
    }
  })
})

describe("loginSchema", () => {
  test("normalises the email to lowercase and trims it", () => {
    // Otherwise "  Owner@Visiora.app " would miss an existing account.
    const result = loginSchema.parse({
      email: "  Owner@Visiora.APP  ",
      password: "anything",
    })

    expect(result.email).toBe("owner@visiora.app")
  })

  test("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false)
  })

  test("accepts any non-empty password", () => {
    // Applying the length policy to sign-in would leak the policy and lock out
    // legitimate legacy credentials.
    expect(loginSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true)
  })

  test("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false)
  })

  test("defaults rememberMe to false", () => {
    expect(loginSchema.parse({ email: "a@b.co", password: "x" }).rememberMe).toBe(false)
  })
})

describe("registerSchema", () => {
  const valid = {
    name: "Farhan Ramadhan",
    email: "farhan@visiora.app",
    password: "a-long-enough-password",
    confirmPassword: "a-long-enough-password",
    acceptTerms: true,
  }

  test("accepts a complete, valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  test("requires at least 12 characters", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "short1!",
      confirmPassword: "short1!",
    })

    expect(result.success).toBe(false)
  })

  test("accepts a long passphrase with no symbols, per NIST guidance", () => {
    // Length is the control; composition rules push users toward predictable
    // substitutions without adding real entropy.
    const result = registerSchema.safeParse({
      ...valid,
      password: "correct horse battery staple",
      confirmPassword: "correct horse battery staple",
    })

    expect(result.success).toBe(true)
  })

  test("rejects mismatched passwords and points at the confirm field", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "something-else-here" })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]!.path).toEqual(["confirmPassword"])
    }
  })

  test("requires the terms to be accepted", () => {
    expect(registerSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false)
  })

  test("rejects a name that is too short", () => {
    expect(registerSchema.safeParse({ ...valid, name: "A" }).success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  test("accepts and normalises a valid email", () => {
    expect(forgotPasswordSchema.parse({ email: "USER@Example.com" }).email).toBe("user@example.com")
  })

  test("rejects an empty email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  test("requires a token", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "a-long-enough-password",
      confirmPassword: "a-long-enough-password",
    })

    expect(result.success).toBe(false)
  })

  test("enforces the same length policy as registration", () => {
    const result = resetPasswordSchema.safeParse({
      token: "tok_123",
      password: "tooshort",
      confirmPassword: "tooshort",
    })

    expect(result.success).toBe(false)
  })
})
