import { describe, expect, test } from "vitest"

import {
  chartColor,
  formatCompact,
  formatDelta,
  formatDuration,
  formatFull,
  formatMetric,
  formatPercentChange,
  formatShare,
  isImprovement,
} from "@/lib/format"

describe("formatCompact", () => {
  test("abbreviates thousands and millions", () => {
    expect(formatCompact(1234)).toBe("1.2K")
    expect(formatCompact(2_132_435)).toBe("2.1M")
  })

  test("leaves small numbers unabbreviated", () => {
    expect(formatCompact(248)).toBe("248")
  })

  test("handles zero", () => {
    expect(formatCompact(0)).toBe("0")
  })
})

describe("formatFull", () => {
  test("groups thousands for readability", () => {
    expect(formatFull(2_132_435)).toBe("2,132,435")
  })

  test("rounds away fractional noise", () => {
    expect(formatFull(1234.7)).toBe("1,235")
  })
})

describe("formatDuration", () => {
  test("shows seconds alone under a minute", () => {
    expect(formatDuration(45)).toBe("45s")
  })

  test("splits into minutes and seconds", () => {
    expect(formatDuration(135)).toBe("2m 15s")
  })

  test("clamps a negative duration to zero rather than emitting nonsense", () => {
    expect(formatDuration(-10)).toBe("0s")
  })
})

describe("formatMetric", () => {
  test("formats a percent from a 0–1 ratio", () => {
    expect(formatMetric(0.0705, "percent")).toBe("7.05%")
  })

  test("formats currency compactly by default", () => {
    expect(formatMetric(1_284_500, "currency")).toBe("$1.3M")
  })

  test("formats currency in full when compact is disabled", () => {
    expect(formatMetric(1500, "currency", { compact: false })).toBe("$1,500")
  })

  test("formats a number in full when compact is disabled", () => {
    expect(formatMetric(2_132_435, "number", { compact: false })).toBe("2,132,435")
  })
})

describe("formatDelta", () => {
  test("marks a rise with a plus", () => {
    expect(formatDelta(1234, "number")).toBe("+1.2K")
  })

  test("marks a fall with a minus sign", () => {
    // U+2212, not a hyphen — it aligns with digits at the same width.
    expect(formatDelta(-1234, "number")).toBe("−1.2K")
  })

  test("uses no sign for no change", () => {
    expect(formatDelta(0, "number")).toBe("0")
  })
})

describe("formatPercentChange", () => {
  test("signs and fixes to one decimal", () => {
    expect(formatPercentChange(12.34)).toBe("+12.3%")
    expect(formatPercentChange(-2.5)).toBe("−2.5%")
    expect(formatPercentChange(0)).toBe("0.0%")
  })
})

describe("formatShare", () => {
  test("renders a 0–1 ratio as a percentage", () => {
    expect(formatShare(0.27)).toBe("27.0%")
  })
})

describe("isImprovement", () => {
  // The core of the direction rule: an up-is-good metric falling is bad, while
  // a down-is-good metric falling is good. Colouring both red would be wrong.
  test("treats a rise as good for an up-is-good metric", () => {
    expect(isImprovement(500, "up-is-good")).toBe(true)
  })

  test("treats a fall as bad for an up-is-good metric", () => {
    expect(isImprovement(-500, "up-is-good")).toBe(false)
  })

  test("treats a fall as good for a down-is-good metric", () => {
    expect(isImprovement(-500, "down-is-good")).toBe(true)
  })

  test("treats a rise as bad for a down-is-good metric", () => {
    expect(isImprovement(500, "down-is-good")).toBe(false)
  })

  test("returns null for no change, so the UI can stay neutral", () => {
    expect(isImprovement(0, "up-is-good")).toBeNull()
    expect(isImprovement(0, "down-is-good")).toBeNull()
  })
})

describe("chartColor", () => {
  test("maps a slot to its CSS custom property", () => {
    expect(chartColor(3)).toBe("var(--chart-3)")
  })

  test("clamps out-of-range slots instead of generating a ninth hue", () => {
    // The palette is validated for exactly eight slots; a 9th must fold in,
    // never be invented.
    expect(chartColor(0)).toBe("var(--chart-1)")
    expect(chartColor(99)).toBe("var(--chart-8)")
  })

  test("rounds a fractional slot", () => {
    expect(chartColor(2.4)).toBe("var(--chart-2)")
  })
})
