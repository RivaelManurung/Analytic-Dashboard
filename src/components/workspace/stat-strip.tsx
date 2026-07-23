import { cn } from "@/lib/utils"

interface Stat {
  label: string
  value: string
  hint?: string
  tone?: "default" | "positive" | "negative" | "warning"
}

const TONE_CLASS: Record<NonNullable<Stat["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-positive",
  negative: "text-destructive",
  warning: "text-warning",
}

/**
 * Compact figure row for pages that need context but not a full chart.
 *
 * Uses <dl> so each label/value pair is programmatically associated, rather
 * than being two visually adjacent but unrelated divs.
 */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <dt className="text-xs font-semibold text-muted-foreground">{stat.label}</dt>
          <dd
            className={cn(
              "tabular-figures mt-2.5 text-3xl leading-none font-semibold tracking-[-0.03em]",
              TONE_CLASS[stat.tone ?? "default"]
            )}
          >
            {stat.value}
          </dd>
          {stat.hint && <dd className="mt-2 text-xs text-muted-foreground">{stat.hint}</dd>}
        </div>
      ))}
    </dl>
  )
}
