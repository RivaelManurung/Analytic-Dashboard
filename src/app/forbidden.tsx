import Link from "next/link"
import { ArrowLeft, ShieldOff } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Rendered when a page calls `forbidden()` — the caller is signed in but lacks
 * the required role. Distinct from 404 on purpose: telling an authenticated
 * user "you don't have access" is more useful than pretending the page is
 * missing, and reveals nothing they could not infer from the nav anyway.
 */
export default function Forbidden() {
  return (
    <div className="grid min-h-svh place-items-center px-5 py-16">
      <main id="main-content" className="w-full max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-negative-muted text-destructive">
          <ShieldOff className="size-6" aria-hidden />
        </span>

        <p className="mt-8 font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Error 403
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          You don&apos;t have access to this page
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your role does not include this area. An admin or the workspace owner can grant you access
          from the team settings.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to the dashboard
          </Link>
          <Link
            href="/profile"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            View your access
          </Link>
        </div>
      </main>
    </div>
  )
}
