"use client"

import { useFormStatus } from "react-dom"
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ActionState } from "@/lib/auth/action-state"

/**
 * Announces the outcome of a form submission.
 *
 * `role="alert"` on the error and `role="status"` on the success are what make
 * the message reach a screen reader — colour and an icon alone do not.
 */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null

  const isError = state.status === "error"

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={
        isError
          ? "flex items-start gap-2 rounded-xl bg-negative-muted px-3 py-2.5 text-sm text-destructive"
          : "flex items-start gap-2 rounded-xl bg-positive-muted px-3 py-2.5 text-sm text-positive"
      }
    >
      {isError ? (
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <span>{state.message}</span>
    </div>
  )
}

/**
 * Submit button that disables itself while the action is in flight.
 * `useFormStatus` must be called from a child of the <form>, which is why this
 * is its own component rather than a prop on the page.
 */
export function SubmitButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="h-11 w-full rounded-xl text-sm font-semibold"
      {...props}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </Button>
  )
}
