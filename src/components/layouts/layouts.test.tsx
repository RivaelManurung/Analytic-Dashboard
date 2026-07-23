import { beforeEach, describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"

import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { SessionUser } from "@/lib/schemas/auth"

const push = vi.fn()

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/followers",
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/lib/auth/actions", () => ({
  logoutAction: vi.fn(),
  initialActionState: { status: "idle" },
}))

const { DashboardSidebar } = await import("@/components/layouts/dashboard-sidebar")
const { DashboardHeader } = await import("@/components/layouts/dashboard-header")
const { UserMenu } = await import("@/components/layouts/user-menu")
const { ThemeToggle } = await import("@/components/theme-toggle")
const { ThemeProvider } = await import("@/components/providers/theme-provider")

const owner: SessionUser = {
  userId: "usr_001",
  email: "owner@visiora.app",
  name: "Farhan Ramadhan",
  role: "owner",
  workspace: "Aerobox Studio",
  avatarUrl: null,
}

const viewer: SessionUser = { ...owner, userId: "usr_003", name: "Bima", role: "viewer" }

const wrap = (ui: React.ReactElement) =>
  render(
    <NuqsTestingAdapter>
      <ThemeProvider attribute="class">
        <TooltipProvider>
          <SidebarProvider>{ui}</SidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
    </NuqsTestingAdapter>
  )

beforeEach(() => {
  vi.clearAllMocks()
})

describe("DashboardSidebar — role-based navigation", () => {
  test("shows admin and owner sections to an owner", () => {
    wrap(<DashboardSidebar user={owner} />)

    expect(screen.getByRole("link", { name: /Team/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Billing/ })).toBeInTheDocument()
  })

  test("hides privileged links from a viewer", () => {
    // Hiding is a convenience, not the control — the server enforces the same
    // rule — but advertising a link that always 403s is a dead end.
    wrap(<DashboardSidebar user={viewer} />)

    expect(screen.queryByRole("link", { name: /Team/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Billing/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Activity log/ })).not.toBeInTheDocument()
  })

  test("still shows unrestricted links to a viewer", () => {
    wrap(<DashboardSidebar user={viewer} />)

    expect(screen.getByRole("link", { name: /Followers/ })).toBeInTheDocument()
    // Exact match: the logo link also contains the word "Dashboard".
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
  })

  test("hides reports from a viewer but shows them to an analyst", () => {
    const { unmount } = wrap(<DashboardSidebar user={viewer} />)
    expect(screen.queryByRole("link", { name: /Reports/ })).not.toBeInTheDocument()
    unmount()

    wrap(<DashboardSidebar user={{ ...owner, role: "analyst" }} />)
    expect(screen.getByRole("link", { name: /Reports/ })).toBeInTheDocument()
  })

  test("marks the current route with aria-current", () => {
    wrap(<DashboardSidebar user={owner} />)

    expect(screen.getByRole("link", { name: /Followers/ })).toHaveAttribute("aria-current", "page")
  })

  test("does not mark the dashboard root as current on a sub-route", () => {
    // Prefix matching would otherwise light up "/" on every page.
    wrap(<DashboardSidebar user={owner} />)

    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current")
  })

  test("shows the workspace and the user's role", () => {
    wrap(<DashboardSidebar user={owner} />)

    expect(screen.getAllByText("Aerobox Studio").length).toBeGreaterThan(0)
    expect(screen.getByText("Owner")).toBeInTheDocument()
  })
})

describe("DashboardHeader", () => {
  test("renders a breadcrumb trail for the current route", () => {
    wrap(<DashboardHeader user={owner} />)

    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument()
    expect(screen.getByText("Followers")).toBeInTheDocument()
  })

  test("exposes the sidebar trigger at every breakpoint", () => {
    // Collapsing the sidebar is useful on a wide screen too; the previous
    // markup hid this control above the md breakpoint.
    wrap(<DashboardHeader user={owner} />)

    const trigger = screen.getByRole("button", { name: /sidebar/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger.className).not.toContain("md:hidden")
  })

  test("labels the notification bell with its unread count", () => {
    wrap(<DashboardHeader user={owner} />)

    expect(screen.getByRole("link", { name: /Notifications, 3 unread/ })).toBeInTheDocument()
  })

  test("shows the export control to an analyst and above", () => {
    wrap(<DashboardHeader user={{ ...owner, role: "analyst" }} />)

    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument()
  })

  test("hides the export control from a viewer", () => {
    // Exporting moves data out of the workspace; the API re-checks this too.
    wrap(<DashboardHeader user={viewer} />)

    expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument()
  })
})

describe("UserMenu", () => {
  test("labels the trigger with the user's name", () => {
    wrap(<UserMenu user={owner} />)

    expect(
      screen.getByRole("button", { name: "Account menu for Farhan Ramadhan" })
    ).toBeInTheDocument()
  })

  test("shows the name and email on the trigger", () => {
    wrap(<UserMenu user={owner} />)

    expect(screen.getByText("Farhan Ramadhan")).toBeInTheDocument()
    expect(screen.getByText("owner@visiora.app")).toBeInTheDocument()
  })

  test("opens a menu with profile, settings, and sign out", async () => {
    const user = userEvent.setup()
    wrap(<UserMenu user={owner} />)

    await user.click(screen.getByRole("button", { name: /Account menu/ }))

    expect(await screen.findByRole("menuitem", { name: /Profile/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Settings/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Sign out/ })).toBeInTheDocument()
  })

  test("submits sign-out as a form, not a GET link", async () => {
    // A GET logout can be triggered by a third-party <img>, which is CSRF.
    const user = userEvent.setup()
    const { container } = wrap(<UserMenu user={owner} />)

    await user.click(screen.getByRole("button", { name: /Account menu/ }))
    await screen.findByRole("menuitem", { name: /Sign out/ })

    expect(container.ownerDocument.querySelector("form")).toBeInTheDocument()
  })
})

describe("ThemeToggle", () => {
  test("renders a labelled control", async () => {
    wrap(<ThemeToggle />)

    expect(await screen.findByRole("button", { name: /theme/i })).toBeInTheDocument()
  })

  test("offers light, dark, and system", async () => {
    const user = userEvent.setup()
    wrap(<ThemeToggle />)

    await user.click(await screen.findByRole("button", { name: /theme/i }))

    expect(await screen.findByRole("menuitem", { name: "Light" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Dark" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "System" })).toBeInTheDocument()
  })
})
