import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Bell } from "lucide-react"

import { EmptyState } from "@/components/states/empty-state"
import { ErrorState } from "@/components/states/error-state"
import {
  ChartCardSkeleton,
  ChartSkeleton,
  MetricCardSkeleton,
  MetricGridSkeleton,
  PageSkeleton,
  TableSkeleton,
} from "@/components/states/skeletons"
import { PageShell, SectionHeading } from "@/components/dashboard/page-shell"
import { LegalPage } from "@/components/legal/legal-page"

describe("EmptyState", () => {
  test("renders the title and description", () => {
    render(<EmptyState title="Nothing here" description="Add something to get started." />)

    expect(screen.getByText("Nothing here")).toBeInTheDocument()
    expect(screen.getByText("Add something to get started.")).toBeInTheDocument()
  })

  test("renders an action when provided", () => {
    render(
      <EmptyState
        title="Nothing here"
        description="Add something."
        icon={Bell}
        action={<button type="button">Create one</button>}
      />
    )

    expect(screen.getByRole("button", { name: "Create one" })).toBeInTheDocument()
  })
})

describe("ErrorState", () => {
  test("announces itself as an alert", () => {
    // A failure has to reach a screen reader, not just show a red panel.
    render(<ErrorState />)

    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  test("uses sensible default copy", () => {
    render(<ErrorState />)

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  })

  test("calls onRetry when the retry button is pressed", async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorState onRetry={onRetry} />)

    await user.click(screen.getByRole("button", { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  test("hides the retry button when no handler is given", () => {
    render(<ErrorState />)

    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument()
  })

  test("shows an opaque reference rather than the underlying error", () => {
    // The raw message can carry file paths or connection details; only the
    // digest is safe to put in front of a user.
    render(<ErrorState reference="a1b2c3d4" />)

    expect(screen.getByText(/Reference: a1b2c3d4/)).toBeInTheDocument()
  })
})

describe("skeletons", () => {
  test("ChartSkeleton reserves the height it is given, preventing layout shift", () => {
    const { container } = render(<ChartSkeleton height={321} />)

    expect(container.firstElementChild).toHaveStyle({ height: "321px" })
  })

  test.each([
    ["MetricCardSkeleton", <MetricCardSkeleton key="m" />],
    ["ChartCardSkeleton", <ChartCardSkeleton key="c" />],
    ["TableSkeleton", <TableSkeleton key="t" />],
    ["PageSkeleton", <PageSkeleton key="p" />],
  ])("%s renders without throwing", (_name, element) => {
    expect(() => render(element)).not.toThrow()
  })

  test("MetricGridSkeleton renders the requested number of placeholders", () => {
    const { container } = render(<MetricGridSkeleton count={3} />)

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThanOrEqual(3)
  })
})

describe("PageShell", () => {
  test("renders the title as the page's single h1", () => {
    render(<PageShell title="Followers">content</PageShell>)

    expect(screen.getByRole("heading", { level: 1, name: "Followers" })).toBeInTheDocument()
  })

  test("provides the #main-content landmark the skip link targets", () => {
    render(<PageShell title="Followers">content</PageShell>)

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content")
  })

  test("renders the description and actions", () => {
    render(
      <PageShell title="Followers" description="Growth over time" actions={<button>Export</button>}>
        content
      </PageShell>
    )

    expect(screen.getByText("Growth over time")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument()
  })
})

describe("SectionHeading", () => {
  test("always renders an h2, keeping the heading outline unbroken", () => {
    render(<SectionHeading title="By channel" description="Split by platform" />)

    expect(screen.getByRole("heading", { level: 2, name: "By channel" })).toBeInTheDocument()
    expect(screen.getByText("Split by platform")).toBeInTheDocument()
  })
})

describe("LegalPage", () => {
  test("renders the title, the updated date, and the body", () => {
    render(
      <LegalPage title="Privacy policy" updated="23 July 2026">
        <p>Body text.</p>
      </LegalPage>
    )

    expect(screen.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeInTheDocument()
    expect(screen.getByText("Last updated 23 July 2026")).toBeInTheDocument()
    expect(screen.getByText("Body text.")).toBeInTheDocument()
  })

  test("links back to the dashboard", () => {
    render(
      <LegalPage title="Terms" updated="today">
        <p>x</p>
      </LegalPage>
    )

    expect(screen.getByRole("link", { name: /back to the dashboard/i })).toHaveAttribute(
      "href",
      "/"
    )
  })
})
