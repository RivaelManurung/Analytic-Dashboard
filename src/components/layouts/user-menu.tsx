"use client"

import Link from "next/link"
import { ChevronsUpDown, LogOut, Settings, UserCircle } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutAction } from "@/lib/auth/actions"
import { ROLE_LABELS, type SessionUser } from "@/lib/schemas/auth"

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-2.5 text-left shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={`Account menu for ${user.name}`}
          >
            <Avatar className="size-8 rounded-xl">
              <AvatarFallback className="rounded-xl bg-foreground text-xs font-semibold text-background">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        }
      />

      <DropdownMenuContent align="end" side="top" className="w-60">
        {/* DropdownMenuLabel maps to Base UI's Menu.GroupLabel, which throws
            without an enclosing Menu.Group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block text-sm font-medium">{user.name}</span>
            <span className="block text-xs text-muted-foreground">
              {ROLE_LABELS[user.role]} · {user.workspace}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserCircle className="size-4" aria-hidden />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/setting" />}>
          <Settings className="size-4" aria-hidden />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* A form, not an onClick: signing out is a state change, so it must be
            a POST. A GET link would let a third-party image tag log the user
            out via CSRF. */}
        <form action={logoutAction}>
          <DropdownMenuItem
            variant="destructive"
            render={<button type="submit" className="w-full" />}
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
