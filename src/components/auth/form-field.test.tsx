import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { AuthField, AuthPasswordField } from "@/components/auth/form-field"
import { FormMessage, SubmitButton } from "@/components/auth/form-status"

describe("AuthField", () => {
  test("associates the label with the input", () => {
    // A placeholder is not a label; without this the field is unlabelled for
    // assistive tech and unfocusable by clicking its text.
    render(<AuthField label="Email" name="email" />)

    expect(screen.getByLabelText("Email")).toBeInTheDocument()
  })

  test("renders a hint and links it via aria-describedby", () => {
    render(<AuthField label="Email" name="email" hint="We never share this." />)

    const input = screen.getByLabelText("Email")
    const hint = screen.getByText("We never share this.")

    expect(input.getAttribute("aria-describedby")).toContain(hint.id)
  })

  test("marks the field invalid and announces the error", () => {
    render(<AuthField label="Email" name="email" errors={["Enter a valid email address"]} />)

    const input = screen.getByLabelText("Email")

    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address")
  })

  test("links the error to the input via aria-describedby", () => {
    render(<AuthField label="Email" name="email" errors={["Required"]} />)

    expect(screen.getByLabelText("Email").getAttribute("aria-describedby")).toContain(
      screen.getByRole("alert").id
    )
  })

  test("hides the hint once an error is present, so the message is unambiguous", () => {
    render(<AuthField label="Email" name="email" hint="A hint" errors={["Required"]} />)

    expect(screen.queryByText("A hint")).not.toBeInTheDocument()
  })

  test("is not marked invalid when there are no errors", () => {
    render(<AuthField label="Email" name="email" />)

    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "false")
  })
})

describe("AuthPasswordField", () => {
  test("masks the value by default", () => {
    render(<AuthPasswordField label="Password" name="password" />)

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password")
  })

  test("reveals the value when the toggle is pressed", async () => {
    const user = userEvent.setup()
    render(<AuthPasswordField label="Password" name="password" />)

    await user.click(screen.getByRole("button", { name: "Show password" }))

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text")
  })

  test("masks it again on a second press", async () => {
    const user = userEvent.setup()
    render(<AuthPasswordField label="Password" name="password" />)

    await user.click(screen.getByRole("button", { name: "Show password" }))
    await user.click(screen.getByRole("button", { name: "Hide password" }))

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password")
  })

  test("exposes toggle state via aria-pressed, not just the icon", async () => {
    const user = userEvent.setup()
    render(<AuthPasswordField label="Password" name="password" />)

    const toggle = screen.getByRole("button", { name: "Show password" })
    expect(toggle).toHaveAttribute("aria-pressed", "false")

    await user.click(toggle)

    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  test("names the toggle after its own field, so several on a page stay distinct", () => {
    // The register form has three password inputs. Three buttons all labelled
    // "Show password" are indistinguishable when navigating by control.
    render(
      <>
        <AuthPasswordField label="Password" name="password" />
        <AuthPasswordField label="Confirm password" name="confirmPassword" />
      </>
    )

    expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show confirm password" })).toBeInTheDocument()
  })

  test("shows validation errors", () => {
    render(
      <AuthPasswordField label="Password" name="password" errors={["Use at least 12 characters"]} />
    )

    expect(screen.getByRole("alert")).toHaveTextContent("Use at least 12 characters")
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true")
  })

  test("renders a hint when there is no error", () => {
    render(<AuthPasswordField label="Password" name="password" hint="At least 12 characters." />)

    expect(screen.getByText("At least 12 characters.")).toBeInTheDocument()
  })
})

describe("FormMessage", () => {
  test("renders nothing while idle", () => {
    const { container } = render(<FormMessage state={{ status: "idle" }} />)

    expect(container).toBeEmptyDOMElement()
  })

  test("announces an error assertively", () => {
    render(<FormMessage state={{ status: "error", message: "Incorrect email or password." }} />)

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Incorrect email or password.")
    expect(alert).toHaveAttribute("aria-live", "assertive")
  })

  test("announces success politely, so it does not interrupt", () => {
    render(<FormMessage state={{ status: "success", message: "Check your inbox." }} />)

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("Check your inbox.")
    expect(status).toHaveAttribute("aria-live", "polite")
  })

  test("renders nothing when the state carries no message", () => {
    const { container } = render(<FormMessage state={{ status: "error" }} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe("SubmitButton", () => {
  test("renders as a submit button", () => {
    render(
      <form>
        <SubmitButton>Sign in</SubmitButton>
      </form>
    )

    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit")
  })

  test("is enabled when the form is idle", () => {
    render(
      <form>
        <SubmitButton>Sign in</SubmitButton>
      </form>
    )

    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled()
  })
})
