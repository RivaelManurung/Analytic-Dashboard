"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table/data-table"
import { ROLE_LABELS } from "@/lib/schemas/auth"
import type { TeamMember } from "@/lib/data/workspace"

const STATUS_STYLE: Record<TeamMember["status"], { className: string; label: string }> = {
  active: { className: "bg-positive-muted text-positive", label: "Active" },
  invited: { className: "bg-warning-muted text-warning", label: "Invited" },
  suspended: { className: "bg-negative-muted text-destructive", label: "Suspended" },
}

export function TeamTable({ members }: { members: TeamMember[] }) {
  const columns = useMemo<ColumnDef<TeamMember>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Member",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-full text-xs">
            {ROLE_LABELS[row.original.role]}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = STATUS_STYLE[row.original.status]
          return (
            <Badge variant="secondary" className={`rounded-full text-xs ${status.className}`}>
              {status.label}
            </Badge>
          )
        },
      },
      { accessorKey: "joinedAt", header: "Joined" },
      { accessorKey: "lastActiveAt", header: "Last active" },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Actions for ${row.original.name}`}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Change role</DropdownMenuItem>
              <DropdownMenuItem>Resend invite</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Remove from workspace</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={members}
      searchColumn="name"
      searchPlaceholder="Search members…"
      emptyMessage="No members match this search."
    />
  )
}
