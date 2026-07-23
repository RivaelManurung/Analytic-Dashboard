"use client"

import { useId, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface AuthFieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  label: string
  name: string
  errors?: string[]
  hint?: string
}

/**
 * A labelled input wired for accessibility.
 *
 * The label is a real <label for>, and errors are linked via aria-describedby
 * with aria-invalid — so a screen reader announces the problem instead of the
 * user only seeing red text.
 */
export function AuthField({ label, name, errors, hint, className, ...props }: AuthFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const hasError = Boolean(errors?.length)

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        aria-invalid={hasError}
        aria-describedby={cn(hasError && errorId, hint && hintId) || undefined}
        className={cn("h-11 rounded-xl", className)}
        {...props}
      />
      {hint && !hasError && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {hasError && <FieldError id={errorId} errors={errors?.map((message) => ({ message }))} />}
    </Field>
  )
}

/**
 * Password input with a reveal toggle.
 *
 * The toggle is a real button with an aria-label that reflects its current
 * state, and aria-pressed so the state is exposed rather than implied by icon.
 */
export function AuthPasswordField({
  label,
  name,
  errors,
  hint,
  ...props
}: Omit<AuthFieldProps, "type">) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const hasError = Boolean(errors?.length)
  const [revealed, setRevealed] = useState(false)

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={revealed ? "text" : "password"}
          aria-invalid={hasError}
          aria-describedby={cn(hasError && errorId, hint && hintId) || undefined}
          className="h-11 rounded-xl pr-11"
          {...props}
        />
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          // The field name is part of the label because a form can carry
          // several password inputs — on the register form, three identical
          // "Show password" buttons would be indistinguishable to a screen
          // reader user navigating by control.
          aria-label={`${revealed ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={revealed}
          className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint && !hasError && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {hasError && <FieldError id={errorId} errors={errors?.map((message) => ({ message }))} />}
    </Field>
  )
}
