"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { LogOut, Monitor, Moon, Sun } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { navGroups } from "@/config/menu"
import { logoutAction } from "@/lib/auth/actions"
import { hasRole, type Role } from "@/lib/schemas/auth"

/**
 * Ctrl/⌘+K navigation.
 *
 * Replaces the previous header "search" input, which focused itself and did
 * nothing else. Items are filtered by role so the palette cannot advertise a
 * page the user will only be bounced out of.
 */
export function CommandPalette({ role }: { role: Role }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Close before navigating, or the dialog lingers over the new page.
  const run = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search pages and run actions"
    >
      <CommandInput placeholder="Jump to a page or run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {navGroups.map((group) => {
          const items = group.items.filter(
            (item) => !item.requiredRole || hasRole(role, item.requiredRole)
          )
          if (items.length === 0) return null

          return (
            <CommandGroup key={group.label} heading={group.label}>
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.href}
                    // Includes the description so fuzzy search matches on
                    // meaning, not just the label.
                    value={`${item.label} ${item.description ?? ""}`}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span>{item.label}</span>
                    {item.description && (
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem value="light theme" onSelect={() => run(() => setTheme("light"))}>
            <Sun className="size-4" aria-hidden />
            Light
          </CommandItem>
          <CommandItem value="dark theme" onSelect={() => run(() => setTheme("dark"))}>
            <Moon className="size-4" aria-hidden />
            Dark
          </CommandItem>
          <CommandItem value="system theme" onSelect={() => run(() => setTheme("system"))}>
            <Monitor className="size-4" aria-hidden />
            System
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Session">
          <CommandItem
            value="sign out log out"
            onSelect={() => run(() => void logoutAction())}
            className="text-destructive"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
