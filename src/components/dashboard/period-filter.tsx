"use client"

import { CalendarRange, GitCompareArrows, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { useAnalyticsFilters } from "@/hooks/use-analytics-filters"
import { PERIOD_LABELS, type Period } from "@/lib/schemas/analytics"
import { cn } from "@/lib/utils"

const PRESETS: Period[] = ["today", "7d", "30d", "90d", "12m"]

/**
 * The dashboard's primary filter row.
 *
 * Every control writes to the URL, so the resulting view is a shareable link
 * and the back button behaves the way users expect.
 */
export function PeriodFilter({ className }: { className?: string }) {
  const { filters, setPeriod, setRange, toggleCompare, reset } = useAnalyticsFilters()

  const isDefault = filters.period === "30d" && !filters.compare && !filters.from

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <ToggleGroup
        // Base UI toggle groups deal in arrays even in single-select mode.
        value={[filters.period]}
        onValueChange={(value) => {
          const next = value[0] as Period | undefined
          if (next) setPeriod(next)
        }}
        aria-label="Reporting period"
        className="h-9 rounded-xl bg-muted p-1"
      >
        {PRESETS.map((preset) => (
          <ToggleGroupItem
            key={preset}
            value={preset}
            aria-label={PERIOD_LABELS[preset]}
            className="h-7 rounded-lg px-3 text-xs font-semibold data-[pressed]:bg-card data-[pressed]:shadow-sm"
          >
            {preset === "today" ? "Today" : preset.toUpperCase()}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <DateRangePicker
        from={filters.from}
        to={filters.to}
        onChange={setRange}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 rounded-xl text-xs font-semibold",
              filters.period === "custom" && "border-ring bg-info-muted"
            )}
          >
            <CalendarRange className="size-3.5" aria-hidden />
            {filters.period === "custom" && filters.from && filters.to
              ? `${filters.from} → ${filters.to}`
              : "Custom range"}
          </Button>
        }
      />

      <Button
        variant="outline"
        size="sm"
        onClick={toggleCompare}
        aria-pressed={filters.compare}
        className={cn(
          "h-9 rounded-xl text-xs font-semibold",
          filters.compare && "border-ring bg-info-muted"
        )}
      >
        <GitCompareArrows className="size-3.5" aria-hidden />
        Compare
      </Button>

      {!isDefault && (
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-9 rounded-xl text-xs text-muted-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset
        </Button>
      )}
    </div>
  )
}
