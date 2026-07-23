import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"

import { TrendChart } from "@/components/charts/trend-chart"
import { MultiSeriesChart } from "@/components/charts/multi-series-chart"
import { AudienceChart } from "@/components/charts/audience-chart"
import { Sparkline } from "@/components/dashboard/sparkline"
import type { AudienceSegment, Timeseries } from "@/lib/schemas/analytics"

const series: Timeseries = {
  key: "followers",
  label: "Followers",
  colorSlot: 1,
  points: [
    { date: "2026-07-01", label: "1 Jul", value: 1000 },
    { date: "2026-07-02", label: "2 Jul", value: 1200 },
    { date: "2026-07-03", label: "3 Jul", value: 1150 },
  ],
}

const comparison: Timeseries = {
  ...series,
  label: "Previous",
  points: series.points.map((point) => ({ ...point, value: point.value * 0.9 })),
}

describe("TrendChart", () => {
  test("renders an SVG surface", () => {
    const { container } = render(<TrendChart series={series} format="number" />)

    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  test("renders without a comparison series", () => {
    expect(() =>
      render(<TrendChart series={series} comparison={null} format="number" />)
    ).not.toThrow()
  })

  test("renders a comparison series when supplied", () => {
    expect(() =>
      render(<TrendChart series={series} comparison={comparison} format="number" />)
    ).not.toThrow()
  })

  test("handles a percent-formatted metric", () => {
    const rate: Timeseries = {
      ...series,
      key: "engagementRate",
      points: series.points.map((point) => ({ ...point, value: 0.07 })),
    }

    expect(() => render(<TrendChart series={rate} format="percent" />)).not.toThrow()
  })

  test("survives a flat series where every value is identical", () => {
    const flat: Timeseries = {
      ...series,
      points: series.points.map((point) => ({ ...point, value: 500 })),
    }

    expect(() => render(<TrendChart series={flat} format="number" />)).not.toThrow()
  })
})

describe("MultiSeriesChart", () => {
  const multi: Timeseries[] = [series, { ...series, key: "likes", label: "Likes", colorSlot: 8 }]

  test("renders a legend entry per series", () => {
    // With two or more series a legend is mandatory — identity must never rest
    // on colour alone.
    render(<MultiSeriesChart series={multi} />)

    expect(screen.getByText("Followers")).toBeInTheDocument()
    expect(screen.getByText("Likes")).toBeInTheDocument()
  })

  test("renders in stacked mode by default", () => {
    const { container } = render(<MultiSeriesChart series={multi} />)

    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  test("renders in grouped mode", () => {
    expect(() => render(<MultiSeriesChart series={multi} variant="grouped" />)).not.toThrow()
  })

  test("survives an empty series list", () => {
    expect(() => render(<MultiSeriesChart series={[]} />)).not.toThrow()
  })
})

describe("AudienceChart", () => {
  const segments: AudienceSegment[] = [
    { bucket: "18–24", male: 100, female: 90, other: 5 },
    { bucket: "25–34", male: 150, female: 140, other: 8 },
  ]

  test("renders a legend naming each gender series", () => {
    render(<AudienceChart segments={segments} />)

    expect(screen.getByText("Male")).toBeInTheDocument()
    expect(screen.getByText("Female")).toBeInTheDocument()
    expect(screen.getByText("Other")).toBeInTheDocument()
  })

  test("renders an SVG surface", () => {
    const { container } = render(<AudienceChart segments={segments} />)

    expect(container.querySelector("svg")).toBeInTheDocument()
  })
})

describe("Sparkline", () => {
  test("renders two paths — the fill and the line", () => {
    const { container } = render(<Sparkline values={[1, 5, 3, 8]} colorSlot={1} />)

    expect(container.querySelectorAll("path")).toHaveLength(2)
  })

  test("is hidden from assistive tech, since the card states the trend in words", () => {
    const { container } = render(<Sparkline values={[1, 5, 3]} colorSlot={1} />)

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  test("renders nothing for fewer than two points", () => {
    const { container } = render(<Sparkline values={[1]} colorSlot={1} />)

    expect(container).toBeEmptyDOMElement()
  })

  test("centres a flat series instead of dividing by zero", () => {
    const { container } = render(<Sparkline values={[5, 5, 5]} colorSlot={1} height={32} />)

    const line = container.querySelectorAll("path")[1]
    // Every point should sit at the vertical midpoint.
    expect(line?.getAttribute("d")).toContain("16.00")
  })

  test("respects an explicit width and height", () => {
    const { container } = render(
      <Sparkline values={[1, 2, 3]} colorSlot={2} width={100} height={40} />
    )

    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("width", "100")
    expect(svg).toHaveAttribute("height", "40")
  })
})
