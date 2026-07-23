"use client"

import { useId, useState } from "react"
import { Table2, LineChart as LineChartIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface ChartTableColumn {
  header: string
  /** Right-align numeric columns so digits line up down the column. */
  numeric?: boolean
}

export interface ChartCardProps {
  title: string
  description?: string
  /** Rendered on the right of the header — filters, legends, menus. */
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  /**
   * Tabular form of the same data.
   *
   * REQUIRED, not optional by oversight. Three slots of the light palette sit
   * below 3:1 contrast against the card surface, which puts this chart under
   * the data-viz "relief rule": the numbers must be reachable without relying
   * on colour. It is also the only way a screen-reader user can read an SVG
   * chart at all.
   */
  table: {
    columns: ChartTableColumn[]
    rows: (string | number)[][]
    caption?: string
  }
}

export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
  table,
}: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart")
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex flex-col rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0">
          <h2 id={headingId} className="text-sm font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
            aria-pressed={view === "table"}
            aria-label={view === "chart" ? `Show ${title} as a table` : `Show ${title} as a chart`}
          >
            {view === "chart" ? (
              <Table2 className="size-3.5" aria-hidden />
            ) : (
              <LineChartIcon className="size-3.5" aria-hidden />
            )}
          </Button>
        </div>
      </header>

      <div className="min-w-0 flex-1 px-5 pt-1 pb-5">
        {view === "chart" ? (
          children
        ) : (
          // Wide tables scroll inside their own container; the page body must
          // never scroll horizontally.
          <div className="max-h-[22rem] overflow-auto rounded-xl border">
            <Table>
              {table.caption && <caption className="sr-only">{table.caption}</caption>}
              <TableHeader className="sticky top-0 bg-muted/50">
                <TableRow>
                  {table.columns.map((column) => (
                    <TableHead
                      key={column.header}
                      scope="col"
                      className={cn("text-xs", column.numeric && "text-right")}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className={cn(
                          "text-xs",
                          table.columns[cellIndex]?.numeric && "tabular-figures text-right"
                        )}
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  )
}
