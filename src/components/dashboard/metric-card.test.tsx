import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { MetricCard } from "@/components/dashboard/metric-card"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { MetricSummary } from "@/lib/schemas/analytics"

const baseMetric: MetricSummary = {
  key: "followers",
  label: "Followers",
  value: 2_132_435,
  previousValue: 2_011_735,
  delta: 120_700,
  deltaPercent: 6.0,
  format: "number",
  direction: "up-is-good",
  colorSlot: 1,
  description: "Total accounts following your profile.",
  sparkline: [10, 20, 15, 30, 28, 40],
}

const renderCard = (props: Parameters<typeof MetricCard>[0]) =>
  render(
    <TooltipProvider>
      <MetricCard {...props} />
    </TooltipProvider>
  )

describe("MetricCard", () => {
  test("renders the label and the compacted value", () => {
    renderCard({ metric: baseMetric })

    expect(screen.getByText("Followers")).toBeInTheDocument()
    expect(screen.getByText("2.1M")).toBeInTheDocument()
  })

  test("shows the percentage change", () => {
    renderCard({ metric: baseMetric })

    expect(screen.getByText("+6.0%")).toBeInTheDocument()
  })

  test("announces the full figure and direction to assistive tech", () => {
    // The visible value is abbreviated to "2.1M"; a screen reader should get
    // the exact number and whether the change was good or bad.
    renderCard({ metric: baseMetric })

    expect(screen.getByText(/Followers: 2,132,435\. Improved by \+6\.0%/)).toBeInTheDocument()
  })

  test("describes a decline as a decline", () => {
    renderCard({
      metric: { ...baseMetric, delta: -50_000, deltaPercent: -2.4 },
    })

    expect(screen.getByText(/Declined by −2\.4%/)).toBeInTheDocument()
  })

  test("treats a fall as an improvement for a down-is-good metric", () => {
    // Direction is per metric, not per sign. A churn metric falling is a win,
    // and the announcement must say so.
    renderCard({
      metric: {
        ...baseMetric,
        label: "Lost followers",
        direction: "down-is-good",
        delta: -400,
        deltaPercent: -8.2,
      },
    })

    expect(screen.getByText(/Improved by −8\.2%/)).toBeInTheDocument()
  })

  test("reports no change neutrally instead of picking a colour", () => {
    renderCard({ metric: { ...baseMetric, delta: 0, deltaPercent: 0 } })

    expect(screen.getByText(/No change by 0\.0%/)).toBeInTheDocument()
  })

  test("formats a percent metric as a percentage", () => {
    renderCard({
      metric: { ...baseMetric, label: "Engagement rate", value: 0.0705, format: "percent" },
    })

    expect(screen.getByText("7.05%")).toBeInTheDocument()
  })

  test("exposes an accessible tooltip trigger describing the metric", () => {
    renderCard({ metric: baseMetric })

    expect(screen.getByRole("button", { name: "What is Followers?" })).toBeInTheDocument()
  })

  test("renders as a link when href is supplied", () => {
    renderCard({ metric: baseMetric, href: "/followers" })

    expect(screen.getByRole("link")).toHaveAttribute("href", "/followers")
  })

  test("gives the link an accessible name of its own", () => {
    renderCard({ metric: baseMetric, href: "/followers" })

    expect(screen.getByRole("link", { name: /View Followers in detail/ })).toBeInTheDocument()
  })

  test("never nests the info button inside the link", () => {
    // `<a><button></button></a>` is invalid HTML: assistive tech mis-announces
    // it, and a click on the button bubbles to the anchor and navigates away
    // instead of opening the tooltip. The link must be a sibling that covers
    // the card via ::after, not a wrapper.
    renderCard({ metric: baseMetric, href: "/followers" })

    const link = screen.getByRole("link")
    const infoButton = screen.getByRole("button", { name: "What is Followers?" })

    expect(link.contains(infoButton)).toBe(false)
  })

  test("keeps the info tooltip reachable above the link overlay", async () => {
    // A tooltip opens on focus, which is also the keyboard path. If the button
    // were inside the anchor, focus would land on the link instead.
    const user = userEvent.setup()
    renderCard({ metric: baseMetric, href: "/followers" })

    const infoButton = screen.getByRole("button", { name: "What is Followers?" })
    await user.tab()

    expect(infoButton).toHaveFocus()
    expect(
      await screen.findByText("Total accounts following your profile.")
    ).toBeInTheDocument()
  })

  test("renders as a plain container when no href is supplied", () => {
    renderCard({ metric: baseMetric })

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
