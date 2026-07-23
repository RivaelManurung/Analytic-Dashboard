import { describe, expect, test } from "vitest"
import { render, screen, within } from "@testing-library/react"

import { BreakdownBars } from "@/components/charts/breakdown-bars"
import { FunnelChart } from "@/components/charts/funnel-chart"
import type { BreakdownItem, FunnelStage } from "@/lib/schemas/analytics"

const items: BreakdownItem[] = [
  { id: "x", label: "X", value: 40_000, share: 0.4, deltaPercent: 12.5, colorSlot: 1 },
  { id: "ig", label: "Instagram", value: 30_000, share: 0.3, deltaPercent: -4.2, colorSlot: 2 },
  { id: "tt", label: "TikTok", value: 20_000, share: 0.2, deltaPercent: 8.1, colorSlot: 3 },
  { id: "li", label: "LinkedIn", value: 10_000, share: 0.1, deltaPercent: 1.0, colorSlot: 4 },
]

describe("BreakdownBars", () => {
  test("directly labels every row with its value and share", () => {
    // Direct labelling is what satisfies the relief rule for the low-contrast
    // palette slots — identity must never rest on colour alone.
    render(<BreakdownBars items={items} />)

    expect(screen.getByText("X")).toBeInTheDocument()
    expect(screen.getByText("40K")).toBeInTheDocument()
    expect(screen.getByText("40.0%")).toBeInTheDocument()
  })

  test("gives each bar an accessible description", () => {
    render(<BreakdownBars items={items} />)

    expect(screen.getByRole("img", { name: "Instagram: 30K, 30.0% of total" })).toBeInTheDocument()
  })

  test("shows the direction of change per row", () => {
    render(<BreakdownBars items={items} />)

    expect(screen.getByText("+12.5%")).toBeInTheDocument()
    expect(screen.getByText("−4.2%")).toBeInTheDocument()
  })

  test("folds everything past the limit into a single Other row", () => {
    // A 9th series must never be given a newly generated hue.
    render(<BreakdownBars items={items} limit={2} />)

    expect(screen.getByText("X")).toBeInTheDocument()
    expect(screen.queryByText("TikTok")).not.toBeInTheDocument()
    expect(screen.getByText("Other (2)")).toBeInTheDocument()
  })

  test("sums the folded rows into the Other total", () => {
    render(<BreakdownBars items={items} limit={2} />)

    // 20,000 + 10,000 = 30K, and 20% + 10% = 30%. Scoped to the Other row,
    // because Instagram also reads 30K at this limit.
    const other = screen.getByRole("img", { name: /^Other \(2\):/ }).closest("li")!

    expect(within(other).getByText("30K")).toBeInTheDocument()
    expect(within(other).getByText("30.0%")).toBeInTheDocument()
  })

  test("renders every row when no limit is given", () => {
    render(<BreakdownBars items={items} />)

    expect(screen.queryByText(/^Other/)).not.toBeInTheDocument()
    expect(screen.getByText("LinkedIn")).toBeInTheDocument()
  })
})

const stages: FunnelStage[] = [
  {
    id: "impressions",
    label: "Impressions",
    value: 100_000,
    conversionFromPrevious: 1,
    conversionFromTop: 1,
  },
  {
    id: "clicks",
    label: "Clicks",
    value: 12_000,
    conversionFromPrevious: 0.12,
    conversionFromTop: 0.12,
  },
  {
    id: "payment",
    label: "Payment",
    value: 3_000,
    conversionFromPrevious: 0.25,
    conversionFromTop: 0.03,
  },
]

describe("FunnelChart", () => {
  test("renders the stages in order as a list", () => {
    render(<FunnelChart stages={stages} />)

    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent("Impressions")
    expect(items[2]).toHaveTextContent("Payment")
  })

  test("labels every stage with its absolute value", () => {
    render(<FunnelChart stages={stages} />)

    expect(screen.getByText("100,000")).toBeInTheDocument()
    expect(screen.getByText("12,000")).toBeInTheDocument()
  })

  test("shows conversion from the previous stage, except on the first", () => {
    render(<FunnelChart stages={stages} />)

    expect(screen.getByText("12.0% of previous")).toBeInTheDocument()
    expect(screen.queryByText("100.0% of previous")).not.toBeInTheDocument()
  })

  test("describes each bar with its share of the top of the funnel", () => {
    render(<FunnelChart stages={stages} />)

    expect(
      screen.getByRole("img", { name: "Payment: 3,000, 3.0% of the top of the funnel" })
    ).toBeInTheDocument()
  })

  test("does not divide by zero when the funnel is empty", () => {
    const empty: FunnelStage[] = [
      { id: "a", label: "A", value: 0, conversionFromPrevious: 1, conversionFromTop: 0 },
    ]

    expect(() => render(<FunnelChart stages={empty} />)).not.toThrow()
  })
})
