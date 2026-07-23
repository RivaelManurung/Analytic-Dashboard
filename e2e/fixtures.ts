import { test as base, expect, type Page } from "@playwright/test"

export const DEMO_ACCOUNTS = {
  owner: { email: "owner@visiora.app", password: "demo-password-owner" },
  analyst: { email: "analyst@visiora.app", password: "demo-password-analyst" },
  viewer: { email: "viewer@visiora.app", password: "demo-password-viewer" },
} as const

export type DemoRole = keyof typeof DEMO_ACCOUNTS

/** Signs in through the real form, so the session cookie is genuinely issued. */
export async function signIn(page: Page, role: DemoRole = "owner") {
  const account = DEMO_ACCOUNTS[role]

  await page.goto("/login")
  await page.getByLabel("Email").fill(account.email)
  // `exact` matters: the reveal toggle is labelled "Show password", which a
  // substring match would also hit.
  await page.getByLabel("Password", { exact: true }).fill(account.password)
  await page.getByRole("button", { name: "Sign in" }).click()

  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible()
}

/** A page that is already authenticated as the given role. */
export const test = base.extend<{ authed: Page; asViewer: Page }>({
  authed: async ({ page }, use) => {
    await signIn(page, "owner")
    await use(page)
  },
  asViewer: async ({ page }, use) => {
    await signIn(page, "viewer")
    await use(page)
  },
})

export { expect }
