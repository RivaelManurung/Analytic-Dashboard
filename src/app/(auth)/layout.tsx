import Link from "next/link"
import { BarChart3, ShieldCheck, Sparkles, TrendingUp } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { siteConfig } from "@/config/site"

/**
 * Required for the nonce-based CSP.
 *
 * A statically prerendered page has its HTML built once, so `proxy.ts` cannot
 * stamp a per-request nonce onto its script tags — the browser then refuses
 * Next.js's inline bootstrap script and the page never hydrates, which silently
 * breaks these forms. Next's own CSP guide states the requirement plainly:
 * nonces require dynamic rendering.
 *
 * Set on the layout so it applies to every auth route below it. These pages are
 * tiny and uncached anyway, so the lost prerender costs nothing.
 */
export const dynamic = "force-dynamic"

const HIGHLIGHTS = [
  {
    icon: TrendingUp,
    title: "Every metric, one window",
    body: "Followers, reach, engagement, and revenue on a single comparable timeline.",
  },
  {
    icon: ShieldCheck,
    title: "Accessible by construction",
    body: "A colourblind-safe palette, keyboard paths, and a table view behind every chart.",
  },
  {
    icon: Sparkles,
    title: "Production-grade from commit one",
    body: "Typed data layer, validated boundaries, CSP, and a tested design system.",
  },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Editorial panel. Hidden below lg — on a phone it would push the form
          below the fold, which is the thing the user actually came for. */}
      <aside className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Atmosphere: two soft light sources rather than a flat fill. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(60rem 40rem at 15% 10%, color-mix(in oklch, var(--chart-1) 42%, transparent), transparent 62%), radial-gradient(45rem 35rem at 85% 85%, color-mix(in oklch, var(--chart-7) 34%, transparent), transparent 60%)",
          }}
        />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-background text-foreground">
              <BarChart3 className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">{siteConfig.name}</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
            Know what your audience actually did.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-background/70">
            {siteConfig.description}
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-background/10 ring-1 ring-background/15">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm leading-relaxed text-background/65">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-background/45">
          © {new Date().getFullYear()} {siteConfig.name}. Demo data only.
        </p>
      </aside>

      <main id="main-content" className="flex flex-col">
        <div className="flex items-center justify-between p-5 lg:justify-end">
          <Link href="/" className="inline-flex items-center gap-2.5 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
              <BarChart3 className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">{siteConfig.name}</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  )
}
