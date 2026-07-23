import Link from "next/link"
import { ArrowLeft, Compass } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center px-5 py-16">
      <main id="main-content" className="w-full max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Compass className="size-6" aria-hidden />
        </span>

        <p className="mt-8 font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Error 404
        </p>
        <h1 className="mt-2 text-display leading-none font-semibold tracking-[-0.04em]">404</h1>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">This page does not exist</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The link may be out of date, or the page may have been renamed. Everything else in{" "}
          {siteConfig.name} is still working.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to the dashboard
          </Link>
          <Link href="/help" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
            Get help
          </Link>
        </div>
      </main>
    </div>
  )
}
