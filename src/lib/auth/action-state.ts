/**
 * Shared state shape for the auth forms.
 *
 * This deliberately lives OUTSIDE `actions.ts`. A `"use server"` module may
 * only export async functions — exporting a plain object from one throws
 * "A 'use server' file can only export async functions, found object" at
 * module-evaluation time, which takes down the whole app at runtime. The
 * production build does not catch it, so keep non-function exports here.
 */
export interface ActionState {
  status: "idle" | "success" | "error"
  message?: string
  /** Field-level errors keyed by input name, for inline display. */
  fieldErrors?: Record<string, string[]>
}

export const initialActionState: ActionState = { status: "idle" }
