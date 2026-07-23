import { beforeEach, describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { ActionState } from "@/lib/auth/action-state"

/**
 * The forms call Server Actions, which cannot execute in jsdom. Each action is
 * replaced with a controllable stub so the tests assert what the component
 * actually owns: which fields it renders, how it wires accessibility, and how
 * it reacts to each action result.
 *
 * The actions' own logic (rate limiting, enumeration resistance, hashing) is
 * covered by the schema, users, and rate-limit suites.
 */
const loginAction = vi.fn<(prev: ActionState, data: FormData) => Promise<ActionState>>()
const registerAction = vi.fn<(prev: ActionState, data: FormData) => Promise<ActionState>>()
const forgotPasswordAction = vi.fn<(prev: ActionState, data: FormData) => Promise<ActionState>>()
const resetPasswordAction = vi.fn<(prev: ActionState, data: FormData) => Promise<ActionState>>()

vi.mock("@/lib/auth/actions", () => ({
  loginAction: (prev: ActionState, data: FormData) => loginAction(prev, data),
  registerAction: (prev: ActionState, data: FormData) => registerAction(prev, data),
  forgotPasswordAction: (prev: ActionState, data: FormData) => forgotPasswordAction(prev, data),
  resetPasswordAction: (prev: ActionState, data: FormData) => resetPasswordAction(prev, data),
}))

const { LoginForm } = await import("@/components/auth/login-form")
const { RegisterForm } = await import("@/components/auth/register-form")
const { ForgotPasswordForm } = await import("@/components/auth/forgot-password-form")
const { ResetPasswordForm } = await import("@/components/auth/reset-password-form")

beforeEach(() => {
  vi.clearAllMocks()
  for (const action of [loginAction, registerAction, forgotPasswordAction, resetPasswordAction]) {
    action.mockResolvedValue({ status: "idle" })
  }
})

describe("LoginForm", () => {
  test("renders labelled email and password fields", () => {
    render(<LoginForm />)

    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
  })

  test("uses autocomplete tokens password managers understand", () => {
    render(<LoginForm />)

    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email")
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password")
  })

  test("offers a remember-me checkbox and a forgot-password link", () => {
    render(<LoginForm />)

    expect(screen.getByRole("checkbox", { name: /keep me signed in/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute(
      "href",
      "/forgot-password"
    )
  })

  test("submits the entered credentials to the action", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText("Email"), "owner@visiora.app")
    await user.type(screen.getByLabelText("Password"), "demo-password-owner")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(loginAction).toHaveBeenCalledOnce()
    const formData = loginAction.mock.calls[0]![1]
    expect(formData.get("email")).toBe("owner@visiora.app")
    expect(formData.get("password")).toBe("demo-password-owner")
  })

  test("announces a failed sign-in as an alert", async () => {
    loginAction.mockResolvedValue({ status: "error", message: "Incorrect email or password." })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.")
  })

  test("shows field-level errors returned by the action", async () => {
    loginAction.mockResolvedValue({
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: { email: ["Enter a valid email address"] },
    })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument()
  })
})

describe("RegisterForm", () => {
  test("renders every required field", () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText("Full name")).toBeInTheDocument()
    expect(screen.getByLabelText("Work email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument()
  })

  test("requests a new-password autocomplete token, not current-password", () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password")
  })

  test("states the length policy up front rather than only on failure", () => {
    render(<RegisterForm />)

    expect(screen.getByText(/At least 12 characters/)).toBeInTheDocument()
  })

  test("links to the terms and privacy pages", () => {
    render(<RegisterForm />)

    expect(screen.getByRole("link", { name: /terms of service/i })).toHaveAttribute(
      "href",
      "/terms"
    )
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy"
    )
  })

  test("surfaces a mismatched-password error against the confirm field", async () => {
    registerAction.mockResolvedValue({
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
    })
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument()
  })

  test("surfaces an unaccepted-terms error", async () => {
    registerAction.mockResolvedValue({
      status: "error",
      fieldErrors: { acceptTerms: ["You must accept the terms to continue"] },
    })
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("You must accept the terms to continue")).toBeInTheDocument()
  })
})

describe("ForgotPasswordForm", () => {
  test("renders a single email field", () => {
    render(<ForgotPasswordForm />)

    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeInTheDocument()
  })

  test("replaces the form with the confirmation on success", async () => {
    // Leaving the form filled in invites repeat submissions that do nothing.
    forgotPasswordAction.mockResolvedValue({
      status: "success",
      message: "If an account exists for that address, a reset link is on its way.",
    })
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)

    await user.click(screen.getByRole("button", { name: "Send reset link" }))

    expect(await screen.findByRole("status")).toHaveTextContent(/reset link is on its way/)
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument()
  })

  test("keeps the form visible on error so the address can be corrected", async () => {
    forgotPasswordAction.mockResolvedValue({
      status: "error",
      message: "Please enter a valid email address.",
    })
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)

    await user.click(screen.getByRole("button", { name: "Send reset link" }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
  })
})

describe("ResetPasswordForm", () => {
  test("carries the token through as a hidden field", () => {
    // Submitting the token keeps the action independent of routing.
    const { container } = render(<ResetPasswordForm token="tok_abc123" />)

    const hidden = container.querySelector('input[name="token"]')
    expect(hidden).toHaveValue("tok_abc123")
  })

  test("renders both password fields", () => {
    render(<ResetPasswordForm token="tok_abc" />)

    expect(screen.getByLabelText("New password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument()
  })

  test("offers a route to sign in once the password is updated", async () => {
    resetPasswordAction.mockResolvedValue({
      status: "success",
      message: "Your password has been updated. You can now sign in.",
    })
    const user = userEvent.setup()
    render(<ResetPasswordForm token="tok_abc" />)

    await user.click(screen.getByRole("button", { name: "Update password" }))

    expect(await screen.findByRole("link", { name: /continue to sign in/i })).toHaveAttribute(
      "href",
      "/login"
    )
  })
})
