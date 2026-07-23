import { describe, expect, test } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"

import { describePeriod, useAnalyticsFilters } from "@/hooks/use-analytics-filters"

/** Renders the hook against a controllable URL, without a real router. */
function renderFilters(searchParams = "") {
  return renderHook(() => useAnalyticsFilters(), {
    wrapper: ({ children }) => (
      <NuqsTestingAdapter searchParams={searchParams}>{children}</NuqsTestingAdapter>
    ),
  })
}

describe("useAnalyticsFilters — reading the URL", () => {
  test("defaults to a 30-day window with comparison off", () => {
    const { result } = renderFilters()

    expect(result.current.filters.period).toBe("30d")
    expect(result.current.filters.compare).toBe(false)
    expect(result.current.filters.from).toBeNull()
  })

  test("reads the period from the query string", () => {
    const { result } = renderFilters("?period=90d")

    expect(result.current.filters.period).toBe("90d")
  })

  test("reads a custom range from the query string", () => {
    const { result } = renderFilters("?period=custom&from=2026-01-01&to=2026-01-31")

    expect(result.current.filters.from).toBe("2026-01-01")
    expect(result.current.filters.to).toBe("2026-01-31")
  })

  test("falls back to the default for an unrecognised period", () => {
    // The URL is user input; an unknown value must not propagate into a query.
    const { result } = renderFilters("?period=forever")

    expect(result.current.filters.period).toBe("30d")
  })

  test("reads the compare flag", () => {
    const { result } = renderFilters("?compare=true")

    expect(result.current.filters.compare).toBe(true)
  })
})

describe("useAnalyticsFilters — updating", () => {
  test("setPeriod switches the preset", async () => {
    const { result } = renderFilters()

    await act(async () => {
      await result.current.setPeriod("7d")
    })

    expect(result.current.filters.period).toBe("7d")
  })

  test("setPeriod clears any custom endpoints, so they cannot conflict", async () => {
    const { result } = renderFilters("?period=custom&from=2026-01-01&to=2026-01-31")

    await act(async () => {
      await result.current.setPeriod("7d")
    })

    expect(result.current.filters.from).toBeNull()
    expect(result.current.filters.to).toBeNull()
  })

  test("setRange implies the custom preset", async () => {
    const { result } = renderFilters()

    await act(async () => {
      await result.current.setRange("2026-03-01", "2026-03-31")
    })

    expect(result.current.filters.period).toBe("custom")
    expect(result.current.filters.from).toBe("2026-03-01")
  })

  test("toggleCompare flips the flag", async () => {
    const { result } = renderFilters()

    await act(async () => {
      await result.current.toggleCompare()
    })

    expect(result.current.filters.compare).toBe(true)
  })

  test("reset restores every default at once", async () => {
    const { result } = renderFilters("?period=custom&from=2026-01-01&to=2026-01-31&compare=true")

    await act(async () => {
      await result.current.reset()
    })

    expect(result.current.filters).toEqual({
      period: "30d",
      from: null,
      to: null,
      compare: false,
    })
  })
})

describe("describePeriod", () => {
  test("describes a preset in days", () => {
    expect(describePeriod("7d")).toBe("Last 7 days")
    expect(describePeriod("90d")).toBe("Last 90 days")
  })

  test("describes the single-day preset as Today", () => {
    expect(describePeriod("today")).toBe("Today")
  })

  test("describes a custom range with both endpoints", () => {
    expect(describePeriod("custom", "2026-01-01", "2026-01-31")).toBe("2026-01-01 → 2026-01-31")
  })

  test("falls back to a label when a custom range is incomplete", () => {
    expect(describePeriod("custom")).toBe("Custom range")
    expect(describePeriod("custom", "2026-01-01", null)).toBe("Custom range")
  })
})
