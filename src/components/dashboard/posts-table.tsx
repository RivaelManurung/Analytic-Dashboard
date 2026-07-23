"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table/data-table"
import { formatFull, formatShare } from "@/lib/format"
import { CHANNEL_LABELS, type Post, type PostStatus } from "@/lib/schemas/analytics"

const STATUS_VARIANT: Record<PostStatus, { className: string; label: string }> = {
  published: { className: "bg-positive-muted text-positive", label: "Published" },
  scheduled: { className: "bg-info-muted text-info", label: "Scheduled" },
  draft: { className: "bg-muted text-muted-foreground", label: "Draft" },
  archived: { className: "bg-warning-muted text-warning", label: "Archived" },
}

export function PostsTable({ posts, pageSize = 10 }: { posts: Post[]; pageSize?: number }) {
  // Memoised because TanStack Table treats a new `columns` identity as a reason
  // to rebuild its internal model on every render.
  const columns = useMemo<ColumnDef<Post>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Post",
        cell: ({ row }) => (
          <div className="max-w-xs min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">
              {CHANNEL_LABELS[row.original.channel]} · {row.original.publishedAt} ·{" "}
              {row.original.author}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = STATUS_VARIANT[row.original.status]
          return (
            <Badge variant="secondary" className={`rounded-full text-xs ${status.className}`}>
              {status.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "impressions",
        header: "Impressions",
        cell: ({ row }) => (
          <span className="tabular-figures">{formatFull(row.original.impressions)}</span>
        ),
      },
      {
        accessorKey: "likes",
        header: "Likes",
        cell: ({ row }) => (
          <span className="tabular-figures">{formatFull(row.original.likes)}</span>
        ),
      },
      {
        accessorKey: "reposts",
        header: "Reposts",
        cell: ({ row }) => (
          <span className="tabular-figures">{formatFull(row.original.reposts)}</span>
        ),
      },
      {
        accessorKey: "engagementRate",
        header: "Eng. rate",
        cell: ({ row }) => (
          <span className="tabular-figures font-medium">
            {formatShare(row.original.engagementRate)}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={posts}
      searchColumn="title"
      searchPlaceholder="Search posts…"
      pageSize={pageSize}
      emptyMessage="No posts were published in this period."
    />
  )
}
