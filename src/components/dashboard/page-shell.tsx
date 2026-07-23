import { cn } from "@/lib/utils"

interface PageShellProps {
  title: string
  description?: string
  /** Filters, export buttons — anything acting on the whole page. */
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Consistent frame for every dashboard page.
 *
 * Owns the single <h1> and the `#main-content` landmark that the skip link
 * targets, so no page has to remember either.
 */
export function PageShell({ title, description, actions, children, className }: PageShellProps) {
  return (
    <main
      id="main-content"
      className={cn("flex flex-1 flex-col gap-6 px-5 py-6 md:px-8", className)}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-[-0.025em]">{title}</h1>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>

      {children}
    </main>
  )
}

/**
 * Section heading inside a page.
 * Always renders an <h2>, so the page keeps a single unbroken heading outline.
 */
export function SectionHeading({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
