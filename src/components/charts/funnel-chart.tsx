"use client"

import { formatFull, formatShare } from "@/lib/format"
import type { FunnelStage } from "@/lib/schemas/analytics"

/**
 * Conversion funnel as a sequential ramp.
 *
 * Funnel stages are ordered, not categorical, so this uses one hue stepped
 * light → dark rather than the categorical palette — colour then carries
 * "further down the funnel" instead of arbitrary identity. Each step also stays
 * above the 2:1 ordinal contrast floor against the card surface.
 *
 * Every stage is directly labelled with its value and both conversion rates,
 * so the ranking is fully readable in greyscale.
 */

// Blue ramp steps 250/350/450/550/650. Validated with `--ordinal`: monotone
// lightness, every adjacent ΔL ≥ 0.06, light end 2.11:1 against white.
// Tighter spacing fails the adjacent-step gate — re-run the validator before
// changing these.
const RAMP = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"]

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.value ?? 0

  return (
    <ol className="space-y-2.5">
      {stages.map((stage, index) => {
        const width = top === 0 ? 0 : (stage.value / top) * 100
        const fill = RAMP[Math.min(index, RAMP.length - 1)]!

        return (
          <li key={stage.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{stage.label}</span>
              <span className="flex items-baseline gap-2.5">
                <span className="tabular-figures text-sm font-semibold">
                  {formatFull(stage.value)}
                </span>
                {index > 0 && (
                  <span className="tabular-figures text-xs text-muted-foreground">
                    {formatShare(stage.conversionFromPrevious)} of previous
                  </span>
                )}
              </span>
            </div>

            <div
              className="relative h-8 w-full overflow-hidden rounded-lg bg-muted"
              role="img"
              aria-label={`${stage.label}: ${formatFull(stage.value)}, ${formatShare(stage.conversionFromTop)} of the top of the funnel`}
            >
              <div
                className="h-full rounded-lg transition-[width] duration-500 ease-out"
                style={{ width: `${width}%`, backgroundColor: fill }}
              />
              <span className="tabular-figures absolute inset-y-0 right-2.5 flex items-center text-xs font-medium text-foreground/70">
                {formatShare(stage.conversionFromTop)}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
