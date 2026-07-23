"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

/**
 * True only after hydration.
 *
 * The server cannot know the visitor's theme, so rendering the real icon on the
 * first pass would hydration-mismatch. `useSyncExternalStore` expresses this
 * directly through its server snapshot — a useState + useEffect flag would be a
 * setState-in-effect cascade for the same result.
 */
const NEVER_CHANGES = () => () => {}
const useHasHydrated = () =>
  useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false
  )

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useHasHydrated()

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="size-9 rounded-xl"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="size-4" />
      </Button>
    )
  }

  const ActiveIcon = resolvedTheme === "dark" ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl"
            aria-label={`Change theme, current theme is ${theme ?? "system"}`}
          >
            <ActiveIcon className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-36">
        {THEMES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            data-active={theme === value}
            className="gap-2 data-[active=true]:bg-accent"
          >
            <Icon className="size-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
