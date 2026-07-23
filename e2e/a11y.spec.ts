import AxeBuilder from "@axe-core/playwright"

import { test, expect } from "./fixtures"

/**
 * Automated accessibility checks.
 *
 * axe catches roughly a third of real WCAG issues — it cannot judge whether a
 * label is meaningful or whether a keyboard path makes sense. The keyboard and
 * theme tests at the bottom cover what the scanner cannot.
 */

async function analyse(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
}

test.describe("authenticated pages", () => {
  const routes = [
    "/",
    "/analytic",
    "/followers",
    "/engagement-rate",
    "/audience",
    "/posts",
    "/team-management",
    "/billing",
    "/reports",
    "/integration",
    "/setting",
    "/profile",
    "/notifications",
    "/activity-log",
    "/help",
  ]

  for (const route of routes) {
    test(`${route} has no detectable violations`, async ({ authed: page }) => {
      await page.goto(route)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

      const results = await analyse(page)

      expect(results.violations).toEqual([])
    })
  }
})

test.describe("public pages", () => {
  for (const route of ["/login", "/register", "/forgot-password", "/terms", "/privacy"]) {
    test(`${route} has no detectable violations`, async ({ page }) => {
      await page.goto(route)

      const results = await analyse(page)

      expect(results.violations).toEqual([])
    })
  }
})

test.describe("dark mode", () => {
  test("the dashboard is accessible in dark mode too", async ({ authed: page }) => {
    // Dark mode is a separately chosen palette, not an automatic inversion, so
    // it needs its own contrast check.
    await page.emulateMedia({ colorScheme: "dark" })
    await page.reload()

    const results = await analyse(page)

    expect(results.violations).toEqual([])
  })

  test("applies the dark class to the document", async ({ authed: page }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.reload()

    await expect(page.locator("html")).toHaveClass(/dark/)
  })
})

test.describe("keyboard navigation", () => {
  test("the skip link is the first focusable element", async ({ authed: page }) => {
    // Without it a keyboard user must tab through the entire sidebar on every
    // page before reaching the content.
    await page.keyboard.press("Tab")

    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused()
  })

  test("the skip link moves focus to the main content", async ({ authed: page }) => {
    await page.keyboard.press("Tab")
    await page.keyboard.press("Enter")

    await expect(page).toHaveURL(/#main-content/)
  })

  test("the chart table toggle is reachable and operable by keyboard", async ({ authed: page }) => {
    const card = page.getByRole("region", { name: "Conversion funnel" })
    const toggle = card.getByRole("button", { name: /as a table/ })

    await toggle.focus()
    await page.keyboard.press("Enter")

    await expect(card.getByRole("table")).toBeVisible()
  })

  test("the command palette closes on Escape", async ({ authed: page }) => {
    await page.keyboard.press("Control+k")
    await expect(page.getByRole("dialog")).toBeVisible()

    await page.keyboard.press("Escape")

    await expect(page.getByRole("dialog")).toBeHidden()
  })

  test("data table sorting is operable by keyboard", async ({ authed: page }) => {
    await page.goto("/analytic")

    const header = page.getByRole("button", { name: /Impressions/ })
    await header.focus()
    await page.keyboard.press("Enter")

    await expect(page.getByRole("columnheader", { name: /Impressions/ })).toHaveAttribute(
      "aria-sort",
      "descending"
    )
  })
})

test.describe("error pages", () => {
  test("404 is accessible and returns the right status", async ({ authed: page }) => {
    const response = await page.goto("/this-route-does-not-exist")

    expect(response?.status()).toBe(404)
    await expect(page.getByRole("heading", { level: 2 })).toContainText("does not exist")

    const results = await analyse(page)
    expect(results.violations).toEqual([])
  })
})
