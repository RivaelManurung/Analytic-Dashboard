import { test, expect } from "./fixtures"

test.describe("dashboard overview", () => {
  test("renders the headline metrics and charts", async ({ authed: page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible()

    await expect(page.getByRole("region", { name: "Metrics over time" })).toBeVisible()
    await expect(page.getByRole("region", { name: "Conversion funnel" })).toBeVisible()
    await expect(page.getByRole("region", { name: "By channel" })).toBeVisible()
  })

  test("links each metric card through to its own page", async ({ authed: page }) => {
    await page
      .getByRole("link", { name: /Followers/ })
      .first()
      .click()

    await expect(page).toHaveURL(/\/followers/)
    await expect(page.getByRole("heading", { level: 1, name: "Followers" })).toBeVisible()
  })
})

test.describe("period filtering", () => {
  test("writes the selected period into the URL", async ({ authed: page }) => {
    await page.getByRole("button", { name: "Last 7 days" }).click()

    await expect(page).toHaveURL(/period=7d/)
  })

  test("survives a reload, because the filter lives in the URL", async ({ authed: page }) => {
    // This is the whole point of URL-as-state: the previous implementation
    // kept the period in local component state, so a refresh silently reset it.
    await page.getByRole("button", { name: "Last 90 days" }).click()
    await expect(page).toHaveURL(/period=90d/)

    await page.reload()

    await expect(page.getByRole("button", { name: "Last 90 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  test("produces a shareable link", async ({ authed: page }) => {
    await page.getByRole("button", { name: "Last 7 days" }).click()
    const url = page.url()

    await page.goto("/")
    await page.goto(url)

    await expect(page.getByRole("button", { name: "Last 7 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  test("offers a reset once the filters are non-default", async ({ authed: page }) => {
    await page.getByRole("button", { name: "Last 7 days" }).click()
    await page.getByRole("button", { name: /Reset/ }).click()

    await expect(page.getByRole("button", { name: "Last 30 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  test("ignores a malformed period in the URL", async ({ authed: page }) => {
    // The query string is user input; a bad value must fall back, not blank the page.
    await page.goto("/?period=not-a-real-period")

    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible()
  })

  // Every preset must render on both the overview and a metric page. "Today"
  // is the one that bites: a single-day range produces exactly one bucket, and
  // a schema demanding two crashed every metric page for that period.
  for (const period of ["today", "7d", "30d", "90d", "12m"]) {
    test(`the ${period} preset renders the overview`, async ({ authed: page }) => {
      await page.goto(`/?period=${period}`)

      await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible()
      await expect(page.getByRole("region", { name: "Metrics over time" })).toBeVisible()
    })

    test(`the ${period} preset renders a metric page`, async ({ authed: page }) => {
      await page.goto(`/followers?period=${period}`)

      await expect(page.getByRole("heading", { level: 1, name: "Followers" })).toBeVisible()
      await expect(page.getByRole("region", { name: /over time/ })).toBeVisible()
    })
  }

  test("renders with comparison enabled on the shortest range", async ({ authed: page }) => {
    await page.goto("/followers?period=today&compare=true")

    await expect(page.getByRole("heading", { level: 1, name: "Followers" })).toBeVisible()
  })
})

test.describe("chart accessibility", () => {
  test("every chart can be read as a table", async ({ authed: page }) => {
    // Three light-mode palette slots sit below 3:1 contrast, so the table view
    // is a requirement, not a nicety.
    const card = page.getByRole("region", { name: "Conversion funnel" })

    await card.getByRole("button", { name: /as a table/ }).click()

    await expect(card.getByRole("table")).toBeVisible()
    await expect(card.getByRole("columnheader", { name: "Stage" })).toBeVisible()
  })

  test("toggles back to the chart", async ({ authed: page }) => {
    const card = page.getByRole("region", { name: "By channel" })

    await card.getByRole("button", { name: /as a table/ }).click()
    await card.getByRole("button", { name: /as a chart/ }).click()

    await expect(card.getByRole("table")).toBeHidden()
  })
})

test.describe("navigation", () => {
  test("opens the command palette with Ctrl+K and navigates", async ({ authed: page }) => {
    await page.keyboard.press("Control+k")

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByRole("option", { name: /Bookmarks/ }).click()

    await expect(page).toHaveURL(/\/bookmarks/)
  })

  test("marks the active sidebar link with aria-current", async ({ authed: page }) => {
    await page.goto("/likes")

    await expect(page.getByRole("link", { name: /Likes/ })).toHaveAttribute("aria-current", "page")
  })

  test("shows a breadcrumb trail", async ({ authed: page }) => {
    await page.goto("/likes")

    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toContainText("Likes")
  })
})

test.describe("metric pages", () => {
  const routes = [
    "/followers",
    "/verified-followers",
    "/profile-visits",
    "/impressions",
    "/likes",
    "/reposts",
    "/bookmarks",
    "/shares",
    "/posts",
    "/replies",
    "/engagement",
    "/engagement-rate",
  ]

  for (const route of routes) {
    test(`${route} renders its chart and table`, async ({ authed: page }) => {
      await page.goto(route)

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      await expect(page.getByRole("region", { name: /over time/ })).toBeVisible()
      await expect(page.getByRole("heading", { name: "Top performing posts" })).toBeVisible()
    })
  }
})

test.describe("data table", () => {
  test("filters posts by title", async ({ authed: page }) => {
    await page.goto("/analytic")

    const search = page.getByRole("textbox", { name: /Search posts/ })
    await search.fill("zzzzzznomatch")

    await expect(page.getByText("No posts were published in this period.")).toBeVisible()
  })

  test("paginates", async ({ authed: page }) => {
    await page.goto("/analytic")

    await expect(page.getByText(/Showing/)).toContainText("1–12")
    await page.getByRole("button", { name: "Next" }).click()
    await expect(page.getByText(/Showing/)).toContainText("13–")
  })
})
