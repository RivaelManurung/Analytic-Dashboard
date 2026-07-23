import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Keyboard, LifeBuoy, MessageSquare, Palette, ShieldCheck } from "lucide-react"

import { PageShell } from "@/components/dashboard/page-shell"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Kbd } from "@/components/ui/kbd"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Help",
  description: "Documentation, shortcuts, and support.",
}

const RESOURCES = [
  {
    icon: BookOpen,
    title: "Metric definitions",
    body: "Exactly how each figure is calculated, and what it excludes.",
  },
  {
    icon: Palette,
    title: "Chart accessibility",
    body: "Why the palette is what it is, and how to read every chart as a table.",
  },
  {
    icon: ShieldCheck,
    title: "Security & data handling",
    body: "Session handling, retention, and what leaves your workspace.",
  },
  {
    icon: MessageSquare,
    title: "Contact support",
    body: "Scale plans get a response within one business day.",
  },
]

const SHORTCUTS = [
  { keys: ["⌘", "K"], action: "Open the command palette" },
  { keys: ["⌘", "B"], action: "Collapse or expand the sidebar" },
  { keys: ["Esc"], action: "Close the current dialog" },
  { keys: ["Tab"], action: "Move to the next control" },
]

const FAQ = [
  {
    question: "Why do the numbers differ from the numbers in each platform?",
    answer:
      "Each platform defines its metrics slightly differently and applies its own de-duplication window. We normalise to a single definition so channels are comparable with each other, which means an individual figure can differ from that platform's own dashboard. The metric definitions page states the exact formula used for each one.",
  },
  {
    question: "How far back does my history go?",
    answer:
      "Starter keeps 30 days, Scale keeps 24 months, and Enterprise keeps up to 7 years. History is retained from the moment an integration is connected — connecting a channel does not backfill data from before that point.",
  },
  {
    question: "Can I read a chart without relying on colour?",
    answer:
      "Yes, and this is a deliberate design requirement rather than an afterthought. Every chart has a table toggle in its top-right corner that shows the same data as numbers. The categorical palette is also validated for colourblind separation, and every series carries a text label in addition to its colour.",
  },
  {
    question: "Why is the export button hidden for some team members?",
    answer:
      "Exporting moves data out of the workspace, so it requires the Analyst role or above. Viewers can read every dashboard but cannot export. The API enforces this independently of the button, so hiding it is a convenience rather than the actual control.",
  },
  {
    question: "What happens when an integration disconnects?",
    answer:
      "Historical data already imported is kept, but no new data arrives, which leaves a silent gap in your reports. The integrations page flags anything that has not synced recently, and you can enable a sync-failure alert under Settings → Notifications.",
  },
]

export default function HelpPage() {
  return (
    <PageShell
      title="Help"
      description="How this dashboard works, what the numbers mean, and how to get support."
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Resources</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {RESOURCES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-colors hover:border-border"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Keyboard className="size-4" aria-hidden />
          Keyboard shortcuts
        </h2>
        <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card shadow-sm">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.action} className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="text-sm">{shortcut.action}</span>
              <span className="flex shrink-0 gap-1">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Frequently asked</h2>
        <Accordion className="rounded-2xl border border-border/70 bg-card px-5 shadow-sm">
          {FAQ.map((entry) => (
            <AccordionItem key={entry.question} value={entry.question}>
              <AccordionTrigger className="text-left text-sm">{entry.question}</AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                {entry.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid size-10 place-items-center rounded-xl bg-muted">
            <LifeBuoy className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Still stuck?</h2>
            <p className="text-xs text-muted-foreground">
              This is a starter kit — the source is the documentation.
            </p>
          </div>
        </div>
        <Link
          href={siteConfig.repository}
          target="_blank"
          // `noopener noreferrer` on every external target="_blank": without it
          // the opened page can reach back through window.opener.
          rel="noopener noreferrer"
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          View the repository
        </Link>
      </section>
    </PageShell>
  )
}
