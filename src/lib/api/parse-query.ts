/**
 * Converts URLSearchParams into a plain object for Zod.
 *
 * Absent keys are omitted rather than set to `undefined`, so schema `.default()`
 * values actually apply. Repeated keys collapse to the first value: the
 * analytics query has no array parameters, and silently accepting `?period=7d&
 * period=90d` would make the effective filter ambiguous.
 */
export function parseSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of searchParams.entries()) {
    if (value !== "" && !(key in result)) {
      result[key] = value
    }
  }

  return result
}
