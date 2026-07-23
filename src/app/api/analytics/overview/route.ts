import type { NextRequest } from "next/server"

import { apiSuccess, apiUnexpectedError, apiError } from "@/lib/api/response"
import { checkRateLimit, clientKey, rateLimitHeaders, RATE_LIMITS } from "@/lib/api/rate-limit"
import { analyticsRepository } from "@/lib/data/repository"
import { analyticsQuerySchema } from "@/lib/schemas/analytics"
import { parseSearchParams } from "@/lib/api/parse-query"
import { requireSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  // `proxy.ts` deliberately excludes /api/** from its matcher, so there is no
  // upstream gate — every route handler must authenticate for itself. Without
  // this, the whole workspace dataset is readable with a bare curl.
  const session = await requireSession()
  if (!session) {
    return apiError("UNAUTHORIZED", "You must be signed in to read analytics.")
  }

  const limit = checkRateLimit(clientKey(request, `overview:${session.userId}`), RATE_LIMITS.read)
  const headers = rateLimitHeaders(limit)

  if (!limit.success) {
    return apiError("RATE_LIMITED", "Too many requests. Please slow down.", { headers })
  }

  try {
    const query = analyticsQuerySchema.parse(parseSearchParams(request.nextUrl.searchParams))
    const overview = await analyticsRepository.getOverview(query)

    return apiSuccess(overview, { headers })
  } catch (error) {
    return apiUnexpectedError(error)
  }
}
