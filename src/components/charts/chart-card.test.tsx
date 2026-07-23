import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ChartCard } from "@/components/charts/chart-card"

const table = {
  caption: "Followers by month",
  columns: [{ header: "Period" }, { header: "Followers", numeric: true }],
  rows: [
    ["Jan", "1,000"],
    ["Feb", "1,250"],
  ],
}

const renderCard = () =>
  render(
    <ChartCard title="Followers over time" description="Monthly totals." table={table}>
      <div data-testid="chart">chart goes here</div>
    </ChartCard>
  )

describe("ChartCard", () => {
  test("renders the chart by default", () => {
    renderCard()

    expect(screen.getByTestId("chart")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  test("labels the section by its heading", () => {
    renderCard()

    expect(screen.getByRole("region", { name: "Followers over time" })).toBeInTheDocument()
  })

  test("switches to the table view when toggled", async () => {
    // The table view is not a nicety. Three slots of the light palette fall
    // below 3:1 contrast, which puts these charts under the relief rule — the
    // numbers must be reachable without relying on colour.
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole("button", { name: /show .* as a table/i }))

    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.queryByTestId("chart")).not.toBeInTheDocument()
  })

  test("renders every data row in the table view", async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole("button", { name: /show .* as a table/i }))

    expect(screen.getByRole("columnheader", { name: "Period" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "1,250" })).toBeInTheDocument()
    // Two data rows plus the header row.
    expect(screen.getAllByRole("row")).toHaveLength(3)
  })

  test("switches back to the chart", async () => {
    const user = userEvent.setup()
    renderCard()

    const toggle = screen.getByRole("button", { name: /show .* as a table/i })
    await user.click(toggle)
    await user.click(screen.getByRole("button", { name: /show .* as a chart/i }))

    expect(screen.getByTestId("chart")).toBeInTheDocument()
  })

  test("exposes the toggle state via aria-pressed", async () => {
    const user = userEvent.setup()
    renderCard()

    const toggle = screen.getByRole("button", { name: /show .* as a table/i })
    expect(toggle).toHaveAttribute("aria-pressed", "false")

    await user.click(toggle)

    expect(screen.getByRole("button", { name: /show .* as a chart/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  test("gives the table a caption for screen readers", async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole("button", { name: /show .* as a table/i }))

    expect(screen.getByRole("table", { name: "Followers by month" })).toBeInTheDocument()
  })
})
