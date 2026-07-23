/**
 * @vitest-environment node
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, test } from "vitest"

/**
 * Structural guard for `"use server"` modules.
 *
 * Next.js allows a `"use server"` file to export ONLY async functions.
 * Exporting anything else — a const, an object, a class — throws
 *   A "use server" file can only export async functions, found object
 * at module-evaluation time, which takes the entire app down at runtime.
 *
 * The production build does NOT catch this, and neither does `tsc`. It cost a
 * fully green build and 415 passing tests before an end-to-end run surfaced it,
 * so this file asserts the rule directly against the source.
 */

const USE_SERVER_MODULES = ["src/lib/auth/actions.ts"]

/** Top-level `export` statements, ignoring `export type`/`export interface`. */
function runtimeExports(source: string): string[] {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, "")

  return withoutBlockComments
    .split("\n")
    .filter((line) => /^export\s/.test(line))
    // `export type` and `export interface` are erased at compile time and are
    // therefore permitted.
    .filter((line) => !/^export\s+(type|interface)\s/.test(line))
    .map((line) => line.trim())
}

describe.each(USE_SERVER_MODULES)("%s", (relativePath) => {
  const source = readFileSync(join(process.cwd(), relativePath), "utf8")

  test("declares the use server directive on the first line", () => {
    expect(source.trimStart().startsWith('"use server"')).toBe(true)
  })

  test("exports only async functions", () => {
    const offenders = runtimeExports(source).filter(
      (line) => !line.startsWith("export async function")
    )

    expect(offenders).toEqual([])
  })

  test("exports no plain constants", () => {
    // The specific mistake that broke the app: `export const initialActionState`.
    // Non-function values belong in a sibling module without the directive.
    expect(runtimeExports(source).some((line) => line.startsWith("export const"))).toBe(false)
  })
})

describe("action-state module", () => {
  const source = readFileSync(join(process.cwd(), "src/lib/auth/action-state.ts"), "utf8")

  test("does NOT carry the use server directive", () => {
    // It exists precisely to hold the non-function exports, so adding the
    // directive here would recreate the bug it was extracted to fix.
    //
    // Checked as a leading directive rather than a substring: the file's own
    // doc comment quotes "use server" while explaining why it must not have it.
    const firstStatement = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0)

    expect(firstStatement).not.toBe('"use server"')
  })

  test("exports the shared initial state", () => {
    expect(source).toContain("export const initialActionState")
  })
})
