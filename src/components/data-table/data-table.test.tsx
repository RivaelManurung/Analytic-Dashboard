import { describe, expect, test } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/data-table/data-table"

interface Row {
  name: string
  score: number
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "score", header: "Score" },
]

const data: Row[] = [
  { name: "Alya", score: 92 },
  { name: "Bima", score: 78 },
  { name: "Citra", score: 85 },
]

describe("DataTable — rendering", () => {
  test("renders a row per record", () => {
    render(<DataTable columns={columns} data={data} />)

    // Three data rows plus the header row.
    expect(screen.getAllByRole("row")).toHaveLength(4)
  })

  test("renders an empty state rather than a blank table body", () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No records yet." />)

    expect(screen.getByText("No records yet.")).toBeInTheDocument()
  })
})

describe("DataTable — sorting", () => {
  test("marks sortable columns with aria-sort", () => {
    // Sort state has to be exposed programmatically; an arrow icon alone is
    // invisible to a screen reader.
    render(<DataTable columns={columns} data={data} />)

    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "none")
  })

  test("sorts a numeric column highest-first on the first click", async () => {
    // TanStack defaults numeric columns to descending-first, which is the
    // right behaviour for a dashboard: the first click on "Impressions"
    // should surface the best performers, not the worst.
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={data} />)

    await user.click(screen.getByRole("button", { name: /Score/ }))

    const rows = screen.getAllByRole("row")
    expect(within(rows[1]!).getByText("92")).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: /Score/ })).toHaveAttribute(
      "aria-sort",
      "descending"
    )
  })

  test("reverses the order on a second click", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={data} />)

    const header = screen.getByRole("button", { name: /Score/ })
    await user.click(header)
    await user.click(header)

    const rows = screen.getAllByRole("row")
    expect(within(rows[1]!).getByText("78")).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: /Score/ })).toHaveAttribute(
      "aria-sort",
      "ascending"
    )
  })

  test("sorts a text column A-to-Z first", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={data} />)

    await user.click(screen.getByRole("button", { name: /Name/ }))

    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending"
    )
  })
})

describe("DataTable — filtering", () => {
  test("filters rows as the user types", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={data} searchColumn="name" />)

    await user.type(screen.getByRole("textbox"), "Alya")

    expect(screen.getByText("Alya")).toBeInTheDocument()
    expect(screen.queryByText("Bima")).not.toBeInTheDocument()
  })

  test("shows the empty state when nothing matches", async () => {
    const user = userEvent.setup()
    render(
      <DataTable columns={columns} data={data} searchColumn="name" emptyMessage="No rows match." />
    )

    await user.type(screen.getByRole("textbox"), "zzzz")

    expect(screen.getByText("No rows match.")).toBeInTheDocument()
  })

  test("hides the search box when no search column is configured", () => {
    render(<DataTable columns={columns} data={data} />)

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  test("gives the search box an accessible name", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        searchColumn="name"
        searchPlaceholder="Search people…"
      />
    )

    expect(screen.getByRole("textbox", { name: "Search people…" })).toBeInTheDocument()
  })
})

describe("DataTable — pagination", () => {
  const many = Array.from({ length: 25 }, (_, index) => ({
    name: `Person ${index + 1}`,
    score: index,
  }))

  test("limits rows to the page size", () => {
    render(<DataTable columns={columns} data={many} pageSize={10} />)

    expect(screen.getAllByRole("row")).toHaveLength(11)
  })

  test("announces the visible range politely", () => {
    // Paging swaps the rows underneath the user; without aria-live a screen
    // reader is given no indication anything changed.
    render(<DataTable columns={columns} data={many} pageSize={10} />)

    const status = screen.getByText(/Showing/)
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveTextContent("1–10")
    expect(status).toHaveTextContent("25")
  })

  test("disables Previous on the first page", () => {
    render(<DataTable columns={columns} data={many} pageSize={10} />)

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()
  })

  test("advances to the next page", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={many} pageSize={10} />)

    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByText(/Showing/)).toHaveTextContent("11–20")
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled()
  })

  test("disables Next on the final page", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={many} pageSize={10} />)

    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
    expect(screen.getByText(/Showing/)).toHaveTextContent("21–25")
  })

  test("hides pagination entirely when there are no rows", () => {
    render(<DataTable columns={columns} data={[]} />)

    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()
  })
})
