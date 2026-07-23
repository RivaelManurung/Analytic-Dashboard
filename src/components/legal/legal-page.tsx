import Link from "next/link"
import { ArrowLeft, BarChart3 } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { siteConfig } from "@/config/site"

/**
 * Shared frame for the legal pages.
 *
 * Prose styling lives here rather than in each document, so terms and privacy
 * cannot drift apart typographically.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
              <BarChart3 className="size-4" aria-hidden />
            </span>
            <span className="font-semibold tracking-tight">{siteConfig.name}</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-[-0.025em]">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>

        <div
          className={[
            "mt-10 space-y-5 text-sm leading-relaxed",
            "[&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
            "[&_p]:text-muted-foreground",
            "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-muted-foreground",
            "[&_strong]:font-semibold [&_strong]:text-foreground",
            "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground",
          ].join(" ")}
        >
          {children}
        </div>

        <Link
          href="/"
          className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to the dashboard
        </Link>
      </main>
    </div>
  )
}
