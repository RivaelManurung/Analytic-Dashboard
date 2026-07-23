import type { Metadata } from "next"
import { forbidden } from "next/navigation"
import { Check, CreditCard, Download } from "lucide-react"

import { PageShell } from "@/components/dashboard/page-shell"
import { StatStrip } from "@/components/workspace/stat-strip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireRole } from "@/lib/auth/session"
import { INVOICES } from "@/lib/data/workspace"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Billing",
  description: "Plan, usage, and invoice history.",
}

const PLANS = [
  {
    name: "Starter",
    price: 0,
    blurb: "For a single channel and one person.",
    features: ["1 channel", "30-day history", "1 seat", "CSV export"],
    current: false,
  },
  {
    name: "Scale",
    price: 499,
    blurb: "For teams running several channels at once.",
    features: [
      "Unlimited channels",
      "24-month history",
      "10 seats",
      "Scheduled reports",
      "Warehouse sync",
    ],
    current: true,
  },
  {
    name: "Enterprise",
    price: null,
    blurb: "SSO, audit retention, and a support SLA.",
    features: [
      "Everything in Scale",
      "SAML SSO",
      "Unlimited seats",
      "7-year audit log",
      "99.9% SLA",
    ],
    current: false,
  },
]

const INVOICE_STATUS: Record<string, { className: string; label: string }> = {
  paid: { className: "bg-positive-muted text-positive", label: "Paid" },
  due: { className: "bg-warning-muted text-warning", label: "Due" },
  failed: { className: "bg-negative-muted text-destructive", label: "Failed" },
}

export default async function BillingPage() {
  // Billing is owner-only. The nav hides it, and this enforces it.
  const session = await requireRole("owner")
  if (!session) forbidden()

  return (
    <PageShell
      title="Billing"
      description="Your plan, what it costs, and every invoice we have issued."
    >
      <StatStrip
        stats={[
          { label: "Current plan", value: "Scale" },
          { label: "Monthly cost", value: "$499" },
          { label: "Seats used", value: "6 / 10" },
          { label: "Next invoice", value: "1 Aug 2026" },
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Plans</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <li
              key={plan.name}
              className={cn(
                "flex flex-col gap-4 rounded-2xl border p-6 shadow-sm",
                plan.current
                  ? "border-ring bg-info-muted ring-2 ring-ring/20"
                  : "border-border/70 bg-card"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{plan.name}</h3>
                  {plan.current && (
                    <Badge variant="secondary" className="rounded-full text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-3xl leading-none font-semibold tracking-[-0.03em]">
                  {plan.price === null ? "Custom" : plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price ? (
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  ) : null}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plan.blurb}</p>
              </div>

              <ul className="flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-positive" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.current ? "outline" : "default"}
                size="sm"
                disabled={plan.current}
                className="rounded-xl"
              >
                {plan.current ? "Current plan" : plan.price === null ? "Contact sales" : "Switch"}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Payment method</h2>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-muted">
              <CreditCard className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium">Visa ending 4242</p>
              <p className="text-xs text-muted-foreground">Expires 09 / 2028</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs">
            Update card
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Invoice history</h2>
        <div className="overflow-x-auto rounded-2xl border border-border/70">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead scope="col">Invoice</TableHead>
                <TableHead scope="col">Period</TableHead>
                <TableHead scope="col">Issued</TableHead>
                <TableHead scope="col" className="text-right">
                  Amount
                </TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">
                  <span className="sr-only">Download</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVOICES.map((invoice) => {
                const status = INVOICE_STATUS[invoice.status]!
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">{invoice.number}</TableCell>
                    <TableCell className="text-sm">{invoice.period}</TableCell>
                    <TableCell className="text-sm">{invoice.issuedAt}</TableCell>
                    <TableCell className="tabular-figures text-right text-sm">
                      ${invoice.amountUsd}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`rounded-full text-xs ${status.className}`}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Download invoice ${invoice.number}`}
                      >
                        <Download className="size-3.5" aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </PageShell>
  )
}
