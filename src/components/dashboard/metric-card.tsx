"use client"

import Link from "next/link"
import type { Route } from "next"
import { ArrowDown, ArrowRight, ArrowUp, Info, Minus } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Sparkline } from "@/components/dashboard/sparkline"
import {
  chartColor,
  formatDelta,
  formatMetric,
  formatPercentChange,
  isImprovement,
} from "@/lib/format"
import { cn } from "@/lib/utils"
import type { MetricSummary } from "@/lib/schemas/analytics"

interface MetricCardProps {
  metric: MetricSummary
  /** Turns the card into a link through to that metric's own page. */
  href?: Route
  /** Emphasised treatment for the single most important figure on a page. */
  featured?: boolean
}

export function MetricCard({ metric, href, featured = false }: MetricCardProps) {
  // Not every metric wants to go up, so "good" comes from the metric's declared
  // direction rather than the sign of the delta.
  const improved = isImprovement(metric.delta, metric.direction)

  const toneClass =
    improved === null ? "text-muted-foreground" : improved ? "text-positive" : "text-destructive"

  const DeltaIcon = improved === null ? Minus : metric.delta > 0 ? ArrowUp : ArrowDown

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: chartColor(metric.colorSlot) }}
          />
          <span className="truncate text-xs font-semibold text-muted-foreground">
            {metric.label}
          </span>
        </span>

        {/* `z-10` lifts this above the card-covering link overlay below, so the
            tooltip stays clickable instead of triggering navigation. */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="relative z-10 shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground"
                aria-label={`What is ${metric.label}?`}
              >
                <Info className="size-3.5" aria-hidden />
              </button>
            }
          />
          <TooltipContent className="max-w-56">
            <p className="text-xs">{metric.description}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "tabular-figures leading-none font-semibold tracking-[-0.03em]",
              featured ? "text-figure" : "text-3xl"
            )}
          >
            {formatMetric(metric.value, metric.format)}
          </p>

          <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", toneClass)}>
            <DeltaIcon className="size-3 shrink-0" aria-hidden />
            <span className="tabular-figures">{formatPercentChange(metric.deltaPercent)}</span>
            <span className="font-normal text-muted-foreground">
              ({formatDelta(metric.delta, metric.format)})
            </span>
          </p>
        </div>

        {/* Decorative: the trend is already stated numerically to its left. */}
        <Sparkline
          values={metric.sparkline}
          colorSlot={metric.colorSlot}
          className="hidden shrink-0 sm:block"
        />
      </div>

      {/* One coherent announcement per card, rather than a screen reader
          reading out a stream of disconnected numbers. */}
      <span className="sr-only">
        {metric.label}: {formatMetric(metric.value, metric.format, { compact: false })}.{" "}
        {improved === null ? "No change" : improved ? "Improved" : "Declined"} by{" "}
        {formatPercentChange(metric.deltaPercent)} versus the previous period.
      </span>
    </>
  )

  const className = cn(
    "group relative flex flex-col rounded-2xl border border-border/70 bg-card p-5 text-card-foreground shadow-sm transition-all",
    href && "hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-within:ring-2 focus-within:ring-ring",
    featured && "sm:col-span-2"
  )

  if (!href) {
    return <div className={className}>{content}</div>
  }

  /*
   * Stretched-link pattern.
   *
   * The link must NOT wrap the card: the card contains the info-tooltip
   * button, and `<a><button></button></a>` is invalid HTML — assistive tech
   * mis-announces it and, worse, clicking the button would bubble to the
   * anchor and navigate away instead of opening the tooltip.
   *
   * Instead the anchor is a sibling whose ::after covers the whole card, so the
   * entire surface is clickable while the DOM stays valid. Anything that needs
   * to stay interactive (the tooltip trigger) sits above it with `z-10`.
   */
  return (
    <div className={className}>
      {content}

      <Link
        href={href}
        className="rounded-2xl after:absolute after:inset-0 after:content-['']"
      >
        <span className="sr-only">View {metric.label} in detail</span>
      </Link>

      <ArrowRight
        aria-hidden
        className="absolute top-5 right-5 size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
      />
    </div>
  )
}
