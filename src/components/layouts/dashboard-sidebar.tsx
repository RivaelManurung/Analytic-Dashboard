"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/components/layouts/user-menu"
import { navGroups } from "@/config/menu"
import { siteConfig } from "@/config/site"
import { hasRole, ROLE_LABELS, type SessionUser } from "@/lib/schemas/auth"

export function DashboardSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-border/70">
      <SidebarHeader className="gap-3 p-4">
        <Link href="/" className="flex items-center gap-3 px-1">
          <span className="grid size-10 place-items-center rounded-xl bg-foreground text-background shadow-sm">
            <BarChart3 className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold">{siteConfig.name}</span>
            <span className="block text-xs text-muted-foreground">{siteConfig.tagline}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2 shadow-sm">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--chart-1), var(--chart-7))" }}
          >
            {user.workspace.charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm leading-tight font-medium">
              {user.workspace}
            </span>
            <span className="block text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </span>
          <Badge variant="secondary" className="ml-auto shrink-0 rounded-full px-2 text-[10px]">
            Active
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="gap-1 px-2 py-3">
        {navGroups.map((group) => {
          // Hide what this role cannot open — showing it only produces a dead
          // end. The server enforces the same rule regardless of this filter.
          const items = group.items.filter(
            (item) => !item.requiredRole || hasRole(user.role, item.requiredRole)
          )
          if (items.length === 0) return null

          return (
            <SidebarGroup key={group.label} className="px-0 py-1">
              <SidebarGroupLabel className="px-3 text-micro text-muted-foreground uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {items.map((item) => {
                    const Icon = item.icon
                    // Exact match for "/", prefix match elsewhere — otherwise
                    // the dashboard root lights up on every page.
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href || pathname.startsWith(`${item.href}/`)

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          className="h-10 rounded-xl px-3 text-sm"
                          render={
                            <Link href={item.href} aria-current={isActive ? "page" : undefined} />
                          }
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <UserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
