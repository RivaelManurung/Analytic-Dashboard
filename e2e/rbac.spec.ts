import { test, expect } from "./fixtures"

/**
 * Role-based access control.
 *
 * The sidebar hides links a role cannot use, but hiding is only a convenience.
 * These tests confirm the server refuses the request even when the URL is typed
 * directly — that is the control that actually matters.
 */

test.describe("viewer restrictions", () => {
  test("does not see privileged links in the sidebar", async ({ asViewer: page }) => {
    await expect(page.getByRole("link", { name: /Billing/ })).toBeHidden()
    await expect(page.getByRole("link", { name: /Team/ })).toBeHidden()
    await expect(page.getByRole("link", { name: /Activity log/ })).toBeHidden()
  })

  test("is refused billing even when the URL is typed directly", async ({ asViewer: page }) => {
    const response = await page.goto("/billing")

    expect(response?.status()).toBe(403)
    await expect(page.getByText(/don't have access to this page/)).toBeVisible()
  })

  test("is refused team management", async ({ asViewer: page }) => {
    const response = await page.goto("/team-management")

    expect(response?.status()).toBe(403)
  })

  test("is refused the activity log", async ({ asViewer: page }) => {
    expect((await page.goto("/activity-log"))?.status()).toBe(403)
  })

  test("is refused reports", async ({ asViewer: page }) => {
    expect((await page.goto("/reports"))?.status()).toBe(403)
  })

  test("does not see the export control", async ({ asViewer: page }) => {
    await expect(page.getByRole("button", { name: /Export/ })).toBeHidden()
  })

  test("is refused the export API directly", async ({ asViewer: page }) => {
    // The hidden button is cosmetic; this is the enforcement.
    const response = await page.request.get("/api/analytics/export?period=30d")

    expect(response.status()).toBe(403)
  })

  test("can still read the dashboards", async ({ asViewer: page }) => {
    await page.goto("/followers")

    await expect(page.getByRole("heading", { level: 1, name: "Followers" })).toBeVisible()
  })

  test("cannot edit workspace settings", async ({ asViewer: page }) => {
    await page.goto("/setting")

    await expect(page.getByLabel("Workspace name")).toBeDisabled()
  })
})

test.describe("owner access", () => {
  test("reaches billing", async ({ authed: page }) => {
    await page.goto("/billing")

    await expect(page.getByRole("heading", { level: 1, name: "Billing" })).toBeVisible()
  })

  test("reaches team management", async ({ authed: page }) => {
    await page.goto("/team-management")

    await expect(page.getByRole("heading", { level: 1, name: "Team" })).toBeVisible()
  })

  test("reaches the activity log", async ({ authed: page }) => {
    await page.goto("/activity-log")

    await expect(page.getByRole("heading", { level: 1, name: "Activity log" })).toBeVisible()
  })

  test("can delete the workspace", async ({ authed: page }) => {
    await page.goto("/setting")

    await expect(page.getByRole("button", { name: /Delete workspace/ })).toBeEnabled()
  })
})

test.describe("API access control", () => {
  // `proxy.ts` excludes /api/** from its matcher, so each handler is its own
  // gate. A handler that forgets to authenticate leaks the whole dataset to a
  // bare curl — these tests are what catch that regression.
  const PROTECTED_ENDPOINTS = [
    "/api/analytics/overview?period=90d",
    "/api/analytics/posts?period=90d",
    "/api/analytics/metrics/revenue?period=12m",
    "/api/analytics/export?period=30d",
  ]

  for (const endpoint of PROTECTED_ENDPOINTS) {
    test(`refuses ${endpoint.split("?")[0]} to an anonymous caller`, async ({ request }) => {
      const response = await request.get(endpoint)

      expect(response.status()).toBe(401)
    })
  }

  test("does not leak any data in the unauthenticated response body", async ({ request }) => {
    const response = await request.get("/api/analytics/overview?period=90d")
    const body = await response.json()

    expect(body.success).toBe(false)
    expect(body).not.toHaveProperty("data")
  })

  // The remaining cases exercise validation, so they must be authenticated —
  // otherwise every one of them would simply return 401 and prove nothing.
  test("validates query parameters", async ({ authed: page }) => {
    const response = await page.request.get("/api/analytics/overview?period=custom")

    // A custom period without endpoints is rejected by the schema.
    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  test("returns 404 for an unknown metric", async ({ authed: page }) => {
    const response = await page.request.get("/api/analytics/metrics/not-a-metric")

    expect(response.status()).toBe(404)
  })

  test("caps the page size", async ({ authed: page }) => {
    const response = await page.request.get("/api/analytics/posts?limit=100000")

    expect(response.status()).toBe(400)
  })

  test("serves a valid overview payload", async ({ authed: page }) => {
    const response = await page.request.get("/api/analytics/overview?period=7d")

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.summaries).toHaveLength(5)
  })

  test("advertises rate-limit headers", async ({ authed: page }) => {
    const response = await page.request.get("/api/analytics/overview")

    expect(response.headers()["ratelimit-limit"]).toBeDefined()
    expect(response.headers()["ratelimit-remaining"]).toBeDefined()
  })
})

test.describe("security headers", () => {
  test("sets a nonce-based CSP without unsafe-inline scripts", async ({ page }) => {
    const response = await page.goto("/login")
    const csp = response?.headers()["content-security-policy"] ?? ""

    expect(csp).toContain("'nonce-")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    // `unsafe-inline` in script-src would defeat the point of the nonce.
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)
  })

  test("sets the standard hardening headers", async ({ page }) => {
    const response = await page.goto("/login")
    const headers = response?.headers() ?? {}

    expect(headers["x-content-type-options"]).toBe("nosniff")
    expect(headers["x-frame-options"]).toBe("DENY")
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin")
  })

  test("does not advertise the framework", async ({ page }) => {
    const response = await page.goto("/login")

    expect(response?.headers()["x-powered-by"]).toBeUndefined()
  })
})
