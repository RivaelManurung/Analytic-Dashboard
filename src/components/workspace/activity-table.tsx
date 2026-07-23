"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table/data-table"
import type { ActivityEntry } from "@/lib/data/workspace"

const CATEGORY_STYLE: Record<ActivityEntry["category"], { className: string; label: string }> = {
  auth: { className: "bg-info-muted text-info", label: "Auth" },
  data: { className: "bg-warning-muted text-warning", label: "Data" },
  settings: { className: "bg-muted text-muted-foreground", label: "Settings" },
  team: { className: "bg-positive-muted text-positive", label: "Team" },
  billing: { className: "bg-negative-muted text-destructive", label: "Billing" },
}

export function ActivityTable({ entries }: { entries: ActivityEntry[] }) {
  const columns = useMemo<ColumnDef<ActivityEntry>[]>(
    () => [
      {
        accessorKey: "actor",
        header: "Actor",
        cell: ({ row }) => <span className="font-medium">{row.original.actor}</span>,
      },
      {
        id: "event",
        header: "Event",
        cell: ({ row }) => (
          <span>
            <span className="font-medium">{row.original.action}</span>{" "}
            <span className="text-muted-foreground">{row.original.target}</span>
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const style = CATEGORY_STYLE[row.original.category]
          return (
            <Badge variant="secondary" className={`rounded-full text-xs ${style.className}`}>
              {style.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "at",
        header: "When",
        cell: ({ row }) => <span className="tabular-figures text-xs">{row.original.at}</span>,
      },
      {
        accessorKey: "ip",
        header: "IP address",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.ip}</span>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={entries}
      searchColumn="actor"
      searchPlaceholder="Search by person…"
      pageSize={15}
      emptyMessage="No activity matches this search."
    />
  )
}
