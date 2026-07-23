import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TeamTable } from "@/components/workspace/team-table"
import { ActivityTable } from "@/components/workspace/activity-table"
import { StatStrip } from "@/components/workspace/stat-strip"
import { PostsTable } from "@/components/dashboard/posts-table"
import { TEAM_MEMBERS, ACTIVITY_LOG } from "@/lib/data/workspace"
import { generatePosts } from "@/lib/data/generator"
import { resolveRange } from "@/lib/date-range"
import { analyticsQuerySchema } from "@/lib/schemas/analytics"

const posts = generatePosts(
  resolveRange(analyticsQuerySchema.parse({ period: "30d" }), new Date(2026, 6, 23)),
  20260101,
  12
)

describe("TeamTable", () => {
  test("renders a row per member with their email", () => {
    render(<TeamTable members={TEAM_MEMBERS.slice(0, 3)} />)

    expect(screen.getByText("Farhan Ramadhan")).toBeInTheDocument()
    expect(screen.getByText("owner@visiora.app")).toBeInTheDocument()
  })

  test("labels each member's role in text, not by colour alone", () => {
    render(<TeamTable members={TEAM_MEMBERS} />)

    expect(screen.getAllByText("Owner").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Viewer").length).toBeGreaterThan(0)
  })

  test("labels the status in text", () => {
    render(<TeamTable members={TEAM_MEMBERS} />)

    expect(screen.getAllByText("Active").length).toBeGreaterThan(0)
    expect(screen.getByText("Suspended")).toBeInTheDocument()
    expect(screen.getByText("Invited")).toBeInTheDocument()
  })

  test("gives every row action menu a distinct accessible name", () => {
    // "Actions" alone would leave a screen reader with six identical buttons.
    render(<TeamTable members={TEAM_MEMBERS} />)

    expect(screen.getByRole("button", { name: "Actions for Farhan Ramadhan" })).toBeInTheDocument()
  })

  test("filters members by name", async () => {
    const user = userEvent.setup()
    render(<TeamTable members={TEAM_MEMBERS} />)

    await user.type(screen.getByRole("textbox"), "Alya")

    expect(screen.getByText("Alya Pratiwi")).toBeInTheDocument()
    expect(screen.queryByText("Farhan Ramadhan")).not.toBeInTheDocument()
  })
})

describe("ActivityTable", () => {
  test("renders the actor and what they did", () => {
    render(<ActivityTable entries={ACTIVITY_LOG} />)

    expect(screen.getAllByText("Farhan Ramadhan").length).toBeGreaterThan(0)
    expect(screen.getByText("Post performance (CSV)")).toBeInTheDocument()
  })

  test("labels the category in text", () => {
    render(<ActivityTable entries={ACTIVITY_LOG} />)

    expect(screen.getAllByText("Data").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Team").length).toBeGreaterThan(0)
  })

  test("shows the source IP, which is the point of an audit log", () => {
    render(<ActivityTable entries={ACTIVITY_LOG} />)

    expect(screen.getAllByText("103.94.12.8").length).toBeGreaterThan(0)
  })

  test("filters by actor", async () => {
    const user = userEvent.setup()
    render(<ActivityTable entries={ACTIVITY_LOG} />)

    await user.type(screen.getByRole("textbox"), "Citra")

    expect(screen.queryByText("Signed in")).not.toBeInTheDocument()
  })
})

describe("PostsTable", () => {
  test("renders post titles and their channel", () => {
    render(<PostsTable posts={posts} />)

    expect(screen.getAllByRole("row").length).toBeGreaterThan(1)
  })

  test("renders an engagement rate per row", () => {
    render(<PostsTable posts={posts} />)

    // Formatted as a percentage, e.g. "5.12%".
    expect(screen.getAllByText(/^\d+\.\d+%$/).length).toBeGreaterThan(0)
  })

  test("shows an empty state when there are no posts", () => {
    render(<PostsTable posts={[]} />)

    expect(screen.getByText("No posts were published in this period.")).toBeInTheDocument()
  })

  test("sorts by impressions when the header is clicked", async () => {
    const user = userEvent.setup()
    render(<PostsTable posts={posts} />)

    await user.click(screen.getByRole("button", { name: /Impressions/ }))

    expect(screen.getByRole("columnheader", { name: /Impressions/ })).toHaveAttribute(
      "aria-sort",
      "descending"
    )
  })
})

describe("StatStrip", () => {
  test("renders each label and value as an associated pair", () => {
    render(
      <StatStrip
        stats={[
          { label: "Total members", value: "6" },
          { label: "Active", value: "4", tone: "positive", hint: "of 6" },
        ]}
      />
    )

    expect(screen.getByText("Total members")).toBeInTheDocument()
    expect(screen.getByText("6")).toBeInTheDocument()
    expect(screen.getByText("of 6")).toBeInTheDocument()
  })

  test("uses a description list so the pairs are programmatically related", () => {
    const { container } = render(<StatStrip stats={[{ label: "Active", value: "4" }]} />)

    expect(container.querySelector("dl")).toBeInTheDocument()
    expect(container.querySelector("dt")).toHaveTextContent("Active")
    expect(container.querySelector("dd")).toHaveTextContent("4")
  })
})
