import { test as base, expect } from "@playwright/test"

import { DEMO_ACCOUNTS, signIn } from "./fixtures"

base.describe("route protection", () => {
  base("redirects an anonymous visitor to the sign-in page", async ({ page }) => {
    await page.goto("/")

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
  })

  base("remembers where the visitor was headed", async ({ page }) => {
    await page.goto("/followers")

    // The intended path is carried in `next` so the user lands there after
    // signing in rather than being dumped on the dashboard root.
    await expect(page).toHaveURL(/next=%2Ffollowers/)
  })

  base("protects every dashboard route", async ({ page }) => {
    for (const route of ["/analytic", "/billing", "/team-management", "/setting"]) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    }
  })

  base("leaves the public legal pages reachable", async ({ page }) => {
    await page.goto("/privacy")

    await expect(page.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeVisible()
  })
})

base.describe("signing in", () => {
  base("rejects the wrong password with a generic message", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(DEMO_ACCOUNTS.owner.email)
    await page.getByLabel("Password", { exact: true }).fill("definitely-the-wrong-password")
    await page.getByRole("button", { name: "Sign in" }).click()

    // Deliberately does not distinguish "no such account" from "wrong
    // password" — anything else is an account-enumeration oracle.
    await expect(page.getByRole("alert")).toContainText("Incorrect email or password")
  })

  base("gives an unknown account the identical message", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("nobody@example.com")
    await page.getByLabel("Password", { exact: true }).fill("some-password-here")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page.getByRole("alert")).toContainText("Incorrect email or password")
  })

  base("signs in and reaches the dashboard", async ({ page }) => {
    await signIn(page, "owner")

    await expect(page).toHaveURL("/")
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible()
  })

  base("issues an httpOnly session cookie", async ({ page, context }) => {
    await signIn(page, "owner")

    const cookie = (await context.cookies()).find((c) => c.name === "visiora_session")

    expect(cookie).toBeDefined()
    // httpOnly is what stops an XSS payload from reading the session.
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe("Lax")
  })

  base("bounces a signed-in user away from the login page", async ({ page }) => {
    await signIn(page, "owner")
    await page.goto("/login")

    await expect(page).toHaveURL("/")
  })
})

base.describe("signing out", () => {
  base("clears the session and returns to login", async ({ page }) => {
    await signIn(page, "owner")

    await page.getByRole("button", { name: /Account menu/ }).click()
    await page.getByRole("menuitem", { name: /Sign out/ }).click()

    await expect(page).toHaveURL(/\/login/)

    // The protected route must be unreachable again afterwards.
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })
})

base.describe("form validation", () => {
  base("reports a mismatched password on the register form", async ({ page }) => {
    await page.goto("/register")

    await page.getByLabel("Full name").fill("Test Person")
    await page.getByLabel("Work email").fill("newperson@example.com")
    await page.getByLabel("Password", { exact: true }).fill("a-long-enough-password")
    await page.getByLabel("Confirm password").fill("a-different-password")
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Create account" }).click()

    await expect(page.getByText("Passwords do not match")).toBeVisible()
  })

  base("rejects a short password", async ({ page }) => {
    await page.goto("/register")

    await page.getByLabel("Full name").fill("Test Person")
    await page.getByLabel("Work email").fill("newperson2@example.com")
    await page.getByLabel("Password", { exact: true }).fill("short")
    await page.getByLabel("Confirm password").fill("short")
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Create account" }).click()

    await expect(page.getByText("Use at least 12 characters")).toBeVisible()
  })

  base("gives the same answer whether or not the account exists", async ({ page }) => {
    await page.goto("/forgot-password")
    await page.getByLabel("Email").fill("nobody-at-all@example.com")
    await page.getByRole("button", { name: "Send reset link" }).click()

    await expect(page.getByRole("status")).toContainText("If an account exists")
  })
})
