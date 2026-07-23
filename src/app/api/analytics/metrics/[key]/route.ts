import type { NextRequest } from "next/server"

import { apiError, apiSuccess, apiUnexpectedError, apiValidationError } from "@/lib/api/response"
import { checkRateLimit, clientKey, rateLimitHeaders, RATE_LIMITS } from "@/lib/api/rate-limit"
import { analyticsRepository } from "@/lib/data/repository"
import { analyticsQuerySchema, metricKeySchema } from "@/lib/schemas/analytics"
import { parseSearchParams } from "@/lib/api/parse-query"
import { requireSession } from "@/lib/auth/session"

export async function GET(
  request: NextRequest,
  // Next 16: route params are a Promise and must be awaited.
  context: { params: Promise<{ key: string }> }
) {
  // /api/** is excluded from the proxy matcher, so this handler is the only
  // gate. `revenue` and `salesOrders` are reachable through this route.
  const session = await requireSession()
  if (!session) {
    return apiError("UNAUTHORIZED", "You must be signed in to read analytics.")
  }

  const limit = checkRateLimit(clientKey(request, `metric:${session.userId}`), RATE_LIMITS.read)
  const headers = rateLimitHeaders(limit)

  if (!limit.success) {
    return apiError("RATE_LIMITED", "Too many requests. Please slow down.", { headers })
  }

  try {
    const { key } = await context.params

    // An unknown metric is a 404, not a 400: the path segment is the resource.
    const parsedKey = metricKeySchema.safeParse(key)
    if (!parsedKey.success) {
      return apiError("NOT_FOUND", `Unknown metric "${key}".`, { headers })
    }

    const query = analyticsQuerySchema.safeParse(parseSearchParams(request.nextUrl.searchParams))
    if (!query.success) {
      return apiValidationError(query.error)
    }

    const detail = await analyticsRepository.getMetricDetail(parsedKey.data, query.data)

    return apiSuccess(detail, { headers })
  } catch (error) {
    return apiUnexpectedError(error)
  }
}
