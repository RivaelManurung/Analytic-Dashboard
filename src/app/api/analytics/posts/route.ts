import type { NextRequest } from "next/server"

import { apiError, apiSuccess, apiUnexpectedError, apiValidationError } from "@/lib/api/response"
import { checkRateLimit, clientKey, rateLimitHeaders, RATE_LIMITS } from "@/lib/api/rate-limit"
import { analyticsRepository } from "@/lib/data/repository"
import { analyticsQuerySchema } from "@/lib/schemas/analytics"
import { parseSearchParams } from "@/lib/api/parse-query"
import { paginationSchema } from "@/lib/schemas/pagination"
import { requireSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  // /api/** is excluded from the proxy matcher, so this handler is the only
  // gate. Post data includes author names and per-post performance.
  const session = await requireSession()
  if (!session) {
    return apiError("UNAUTHORIZED", "You must be signed in to read analytics.")
  }

  const limit = checkRateLimit(clientKey(request, `posts:${session.userId}`), RATE_LIMITS.read)
  const headers = rateLimitHeaders(limit)

  if (!limit.success) {
    return apiError("RATE_LIMITED", "Too many requests. Please slow down.", { headers })
  }

  try {
    const raw = parseSearchParams(request.nextUrl.searchParams)

    const query = analyticsQuerySchema.safeParse(raw)
    if (!query.success) return apiValidationError(query.error)

    const page = paginationSchema.safeParse(raw)
    if (!page.success) return apiValidationError(page.error)

    const all = await analyticsRepository.listPosts(query.data)

    // Always paginate. An unbounded list is a denial-of-service vector and
    // gets slower for every client as the dataset grows.
    const start = (page.data.page - 1) * page.data.limit
    const items = all.slice(start, start + page.data.limit)

    return apiSuccess(items, {
      headers,
      meta: { total: all.length, page: page.data.page, limit: page.data.limit },
    })
  } catch (error) {
    return apiUnexpectedError(error)
  }
}
