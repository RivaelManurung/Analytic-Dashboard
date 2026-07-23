import type { NextRequest } from "next/server"
import { z } from "zod"

import { apiError, apiUnexpectedError, apiValidationError } from "@/lib/api/response"
import { checkRateLimit, clientKey, rateLimitHeaders, RATE_LIMITS } from "@/lib/api/rate-limit"
import { analyticsRepository } from "@/lib/data/repository"
import { analyticsQuerySchema, type Post } from "@/lib/schemas/analytics"
import { parseSearchParams } from "@/lib/api/parse-query"
import { csvFilename, toCsv, type CsvColumn } from "@/lib/csv"
import { requireSession } from "@/lib/auth/session"

const exportQuerySchema = z.object({ dataset: z.enum(["posts", "summaries"]).default("posts") })

const POST_COLUMNS: CsvColumn<Post>[] = [
  { header: "ID", value: (p) => p.id },
  { header: "Title", value: (p) => p.title },
  { header: "Channel", value: (p) => p.channel },
  { header: "Status", value: (p) => p.status },
  { header: "Published at", value: (p) => p.publishedAt },
  { header: "Author", value: (p) => p.author },
  { header: "Impressions", value: (p) => p.impressions },
  { header: "Likes", value: (p) => p.likes },
  { header: "Replies", value: (p) => p.replies },
  { header: "Reposts", value: (p) => p.reposts },
  { header: "Bookmarks", value: (p) => p.bookmarks },
  { header: "Shares", value: (p) => p.shares },
  { header: "Engagement rate", value: (p) => (p.engagementRate * 100).toFixed(2) },
]

export async function GET(request: NextRequest) {
  // An export dumps the whole dataset, so authenticate before doing any work.
  const session = await requireSession()
  if (!session) {
    return apiError("UNAUTHORIZED", "You must be signed in to export data.")
  }

  const limit = checkRateLimit(clientKey(request, `export:${session.userId}`), RATE_LIMITS.export)
  const headers = rateLimitHeaders(limit)

  if (!limit.success) {
    return apiError("RATE_LIMITED", "Export limit reached. Try again shortly.", { headers })
  }

  try {
    const raw = parseSearchParams(request.nextUrl.searchParams)

    const query = analyticsQuerySchema.safeParse(raw)
    if (!query.success) return apiValidationError(query.error)

    const options = exportQuerySchema.safeParse(raw)
    if (!options.success) return apiValidationError(options.error)

    const overview = await analyticsRepository.getOverview(query.data)

    const csv =
      options.data.dataset === "posts"
        ? toCsv(await analyticsRepository.listPosts(query.data), POST_COLUMNS)
        : toCsv(overview.summaries, [
            { header: "Metric", value: (s) => s.label },
            { header: "Value", value: (s) => s.value },
            { header: "Previous value", value: (s) => s.previousValue },
            { header: "Change", value: (s) => s.delta },
            { header: "Change %", value: (s) => s.deltaPercent.toFixed(2) },
          ])

    const filename = csvFilename(options.data.dataset, overview.range.from, overview.range.to)

    return new Response(csv, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // The export reflects the caller's session; it must never be shared.
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    return apiUnexpectedError(error)
  }
}
