import { NextResponse } from "next/server"
import { ZodError } from "zod"

/**
 * One response envelope for every route handler, so clients can branch on
 * `success` without special-casing each endpoint.
 */
export type ApiResponse<T> =
  { success: true; data: T; meta?: ApiMeta } | { success: false; error: ApiError }

export interface ApiMeta {
  total?: number
  page?: number
  limit?: number
}

export interface ApiError {
  code: ApiErrorCode
  message: string
  /** Field-level messages for form display. Only set on validation failures. */
  fields?: Record<string, string[]>
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
}

export function apiSuccess<T>(
  data: T,
  init: { meta?: ApiMeta; status?: number; headers?: HeadersInit } = {}
): NextResponse<ApiResponse<T>> {
  const { meta, status = 200, headers } = init
  return NextResponse.json(
    { success: true as const, data, ...(meta && { meta }) },
    {
      status,
      headers,
    }
  )
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  init: { fields?: Record<string, string[]>; headers?: HeadersInit } = {}
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false as const,
      error: { code, message, ...(init.fields && { fields: init.fields }) },
    },
    { status: STATUS_BY_CODE[code], headers: init.headers }
  )
}

/**
 * Turns a Zod failure into a 400 with per-field messages.
 * Only validation details are exposed — never an internal stack.
 */
export function apiValidationError(error: ZodError): NextResponse<ApiResponse<never>> {
  const fields: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root"
    fields[path] = [...(fields[path] ?? []), issue.message]
  }

  return apiError("VALIDATION_ERROR", "The request parameters are invalid.", { fields })
}

/**
 * Last-resort handler for a route.
 *
 * The client always receives a generic message: an exception can carry
 * connection strings or file paths, and leaking those is an information
 * disclosure bug. The detail goes to the server log only.
 */
export function apiUnexpectedError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof ZodError) {
    return apiValidationError(error)
  }

  console.error("[api] Unhandled route error:", error)

  return apiError("INTERNAL_ERROR", "Something went wrong. Please try again.")
}
