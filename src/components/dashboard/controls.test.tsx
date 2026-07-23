import { beforeEach, describe, expect, test, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"

const push = vi.fn()
const setTheme = vi.fn()

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/",
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", resolvedTheme: "light", setTheme }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/lib/auth/actions", () => ({
  logoutAction: vi.fn(),
  initialActionState: { status: "idle" },
}))

const { PeriodFilter } = await import("@/components/dashboard/period-filter")
const { DateRangePicker } = await import("@/components/dashboard/date-range-picker")
const { ExportButton } = await import("@/components/dashboard/export-button")
const { CommandPalette } = await import("@/components/dashboard/command-palette")
const { Button } = await import("@/components/ui/button")

const wrap = (ui: React.ReactElement, searchParams = "") =>
  render(<NuqsTestingAdapter searchParams={searchParams}>{ui}</NuqsTestingAdapter>)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("PeriodFilter", () => {
  test("renders every preset in a labelled group", () => {
    wrap(<PeriodFilter />)

    expect(screen.getByRole("group", { name: "Reporting period" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Last 7 days" })).toBeInTheDocument()
  })

  test("marks the active preset as pressed", () => {
    wrap(<PeriodFilter />, "?period=7d")

    expect(screen.getByRole("button", { name: "Last 7 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  test("writes the chosen preset to the URL", async () => {
    const user = userEvent.setup()
    wrap(<PeriodFilter />)

    await user.click(screen.getByRole("button", { name: "Last 90 days" }))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Last 90 days" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    )
  })

  test("exposes the compare toggle state", () => {
    wrap(<PeriodFilter />, "?compare=true")

    expect(screen.getByRole("button", { name: /compare/i })).toHaveAttribute("aria-pressed", "true")
  })

  test("hides Reset while the filters are at their defaults", () => {
    wrap(<PeriodFilter />)

    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument()
  })

  test("offers Reset once a filter is non-default", () => {
    wrap(<PeriodFilter />, "?period=90d")

    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument()
  })

  test("shows the active custom range on the trigger", () => {
    wrap(<PeriodFilter />, "?period=custom&from=2026-01-01&to=2026-01-31")

    expect(screen.getByRole("button", { name: "2026-01-01 → 2026-01-31" })).toBeInTheDocument()
  })
})

describe("DateRangePicker", () => {
  test("renders the supplied trigger", () => {
    render(
      <DateRangePicker from={null} to={null} onChange={vi.fn()} trigger={<Button>Pick</Button>} />
    )

    expect(screen.getByRole("button", { name: "Pick" })).toBeInTheDocument()
  })

  test("opens a calendar with Apply disabled until a full range is chosen", async () => {
    const user = userEvent.setup()
    render(
      <DateRangePicker from={null} to={null} onChange={vi.fn()} trigger={<Button>Pick</Button>} />
    )

    await user.click(screen.getByRole("button", { name: "Pick" }))

    expect(await screen.findByRole("button", { name: "Apply range" })).toBeDisabled()
  })

  test("enables Apply when both endpoints are already set", async () => {
    const user = userEvent.setup()
    render(
      <DateRangePicker
        from="2026-01-01"
        to="2026-01-31"
        onChange={vi.fn()}
        trigger={<Button>Pick</Button>}
      />
    )

    await user.click(screen.getByRole("button", { name: "Pick" }))

    expect(await screen.findByRole("button", { name: "Apply range" })).toBeEnabled()
  })

  test("clears the range and closes", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DateRangePicker
        from="2026-01-01"
        to="2026-01-31"
        onChange={onChange}
        trigger={<Button>Pick</Button>}
      />
    )

    await user.click(screen.getByRole("button", { name: "Pick" }))
    await user.click(await screen.findByRole("button", { name: "Clear" }))

    expect(onChange).toHaveBeenCalledWith(null, null)
  })

  test("re-seeds the draft from props each time it opens", async () => {
    // `draft` is derived state and this component never unmounts — only the
    // popup does. Without re-seeding, an external reset (Reset button, or
    // switching preset) would leave a stale range showing on reopen.
    const user = userEvent.setup()
    const { rerender } = render(
      <DateRangePicker
        from="2026-01-01"
        to="2026-01-31"
        onChange={vi.fn()}
        trigger={<Button>Pick</Button>}
      />
    )

    await user.click(screen.getByRole("button", { name: "Pick" }))
    expect(await screen.findByRole("button", { name: "Apply range" })).toBeEnabled()
    await user.keyboard("{Escape}")

    // Simulate the URL being cleared by PeriodFilter's Reset.
    rerender(
      <DateRangePicker from={null} to={null} onChange={vi.fn()} trigger={<Button>Pick</Button>} />
    )

    await user.click(screen.getByRole("button", { name: "Pick" }))

    // A stale draft would leave Apply enabled here.
    expect(await screen.findByRole("button", { name: "Apply range" })).toBeDisabled()
  })

  test("ignores a malformed date from the URL rather than crashing", () => {
    // The value comes straight from the query string, so it may be junk.
    expect(() =>
      render(
        <DateRangePicker
          from="not-a-date"
          to="also-not"
          onChange={vi.fn()}
          trigger={<Button>Pick</Button>}
        />
      )
    ).not.toThrow()
  })
})

describe("ExportButton", () => {
  test("offers both datasets", async () => {
    const user = userEvent.setup()
    wrap(<ExportButton />)

    await user.click(screen.getByRole("button", { name: /export/i }))

    expect(await screen.findByRole("menuitem", { name: /Metric summary/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Post performance/ })).toBeInTheDocument()
  })

  test("requests the export with the active filters applied", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("a,b\n1,2", {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="posts_2026-01-01_to_2026-01-31.csv"',
        },
      })
    )
    // jsdom implements neither of these.
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock")
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})

    const user = userEvent.setup()
    wrap(<ExportButton />, "?period=90d")

    await user.click(screen.getByRole("button", { name: /export/i }))
    await user.click(await screen.findByRole("menuitem", { name: /Post performance/ }))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(String(fetchSpy.mock.calls[0]![0])).toContain("period=90d")
    expect(String(fetchSpy.mock.calls[0]![0])).toContain("dataset=posts")
  })
})

describe("CommandPalette", () => {
  test("stays closed until the shortcut is pressed", () => {
    render(<CommandPalette role="owner" />)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  test("opens on Ctrl+K", async () => {
    const user = userEvent.setup()
    render(<CommandPalette role="owner" />)

    await user.keyboard("{Control>}k{/Control}")

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  test("lists navigation entries the role can reach", async () => {
    const user = userEvent.setup()
    render(<CommandPalette role="owner" />)

    await user.keyboard("{Control>}k{/Control}")

    expect(await screen.findByText("Followers")).toBeInTheDocument()
    expect(screen.getByText("Billing")).toBeInTheDocument()
  })

  test("omits entries the role cannot reach", async () => {
    // Advertising a page that immediately 403s is worse than not listing it.
    const user = userEvent.setup()
    render(<CommandPalette role="viewer" />)

    await user.keyboard("{Control>}k{/Control}")

    await screen.findByText("Followers")
    expect(screen.queryByText("Billing")).not.toBeInTheDocument()
    expect(screen.queryByText("Activity log")).not.toBeInTheDocument()
  })

  test("navigates when an entry is chosen", async () => {
    const user = userEvent.setup()
    render(<CommandPalette role="owner" />)

    await user.keyboard("{Control>}k{/Control}")
    await user.click(await screen.findByText("Followers"))

    await waitFor(() => expect(push).toHaveBeenCalledWith("/followers"))
  })

  test("offers theme commands", async () => {
    const user = userEvent.setup()
    render(<CommandPalette role="owner" />)

    await user.keyboard("{Control>}k{/Control}")
    await user.click(await screen.findByText("Dark"))

    await waitFor(() => expect(setTheme).toHaveBeenCalledWith("dark"))
  })
})
