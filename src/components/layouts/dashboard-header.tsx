"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { ThemeToggle } from "@/components/theme-toggle"
import { ExportButton } from "@/components/dashboard/export-button"
import { navGroups } from "@/config/menu"
import { hasRole, type SessionUser } from "@/lib/schemas/auth"
import { cn } from "@/lib/utils"

/** Finds the nav entry and its group for the current path, for the breadcrumb. */
function locate(pathname: string) {
  for (const group of navGroups) {
    const item = group.items.find((candidate) => candidate.href === pathname)
    if (item) return { group, item }
  }
  return null
}

export function DashboardHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const location = locate(pathname)

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border/70 bg-background/80 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {/* Visible at every size: collapsing the sidebar is useful on a wide
            screen too, and the previous `md:hidden` made it desktop-only. */}
        <SidebarTrigger className="shrink-0" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            {location && location.item.href !== "/" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="hidden sm:block">
                  <span className="text-muted-foreground">{location.group.label}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{location.item.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Opens the real command palette. The previous version was an input
            that focused itself and searched nothing. */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
            )
          }
          className="hidden h-9 w-56 justify-start rounded-xl px-3 text-xs font-normal text-muted-foreground md:flex"
        >
          <Search className="size-3.5" aria-hidden />
          Search or jump to…
          <Kbd className="ml-auto">⌘K</Kbd>
        </Button>

        {/* A real <Link> styled with buttonVariants, rather than <Button
            render={<Link/>}>. Base UI's Button assumes a native <button>; asked
            to render an anchor it warns, and `nativeButton={false}` "fixes" the
            warning by emitting <a role="button">, which announces a navigation
            control as a button. Styling a plain link keeps the semantics right. */}
        <Link
          href="/notifications"
          aria-label="Notifications, 3 unread"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "relative size-9 rounded-xl"
          )}
        >
          <Bell className="size-4" aria-hidden />
          <Badge
            aria-hidden
            className="absolute -top-1 -right-1 size-4 justify-center rounded-full bg-destructive p-0 text-[9px] text-white"
          >
            3
          </Badge>
        </Link>

        <ThemeToggle />

        {/* Exporting is a data-egress action, so viewers do not get the button.
            The API re-checks the session independently. */}
        {hasRole(user.role, "analyst") && <ExportButton />}

        <CommandPalette role={user.role} />
      </div>
    </header>
  )
}
