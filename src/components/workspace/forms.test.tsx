import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { SettingsForm } from "@/components/workspace/settings-form"
import { ProfileForm } from "@/components/workspace/profile-form"
import type { SessionUser } from "@/lib/schemas/auth"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const owner: SessionUser = {
  userId: "usr_001",
  email: "owner@visiora.app",
  name: "Farhan Ramadhan",
  role: "owner",
  workspace: "Aerobox Studio",
  avatarUrl: null,
}

const viewer: SessionUser = { ...owner, role: "viewer" }
const admin: SessionUser = { ...owner, role: "admin" }

describe("SettingsForm — workspace section", () => {
  test("pre-fills the workspace name", () => {
    render(<SettingsForm user={owner} />)

    expect(screen.getByLabelText("Workspace name")).toHaveValue("Aerobox Studio")
  })

  test("enables the workspace fields for an admin", () => {
    render(<SettingsForm user={admin} />)

    expect(screen.getByLabelText("Workspace name")).toBeEnabled()
  })

  test("disables the workspace fields for a viewer", () => {
    // A viewer can read the settings but must not be able to edit them.
    render(<SettingsForm user={viewer} />)

    expect(screen.getByLabelText("Workspace name")).toBeDisabled()
    expect(screen.getByLabelText("Reporting timezone")).toBeDisabled()
  })

  test("explains why the fields are locked", () => {
    render(<SettingsForm user={viewer} />)

    expect(screen.getByText(/Only admins and owners can change these/)).toBeInTheDocument()
  })

  test("offers timezone and currency selects", () => {
    render(<SettingsForm user={owner} />)

    expect(screen.getByLabelText("Reporting timezone")).toHaveValue("Asia/Jakarta")
    expect(screen.getByLabelText("Revenue currency")).toHaveValue("USD")
  })
})

describe("SettingsForm — toggles", () => {
  test("renders each toggle as a labelled switch", () => {
    render(<SettingsForm user={owner} />)

    expect(screen.getByRole("switch", { name: /Weekly digest/ })).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: /Compact numbers/ })).toBeInTheDocument()
  })

  test("describes each toggle via aria-describedby", () => {
    render(<SettingsForm user={owner} />)

    const toggle = screen.getByRole("switch", { name: /Threshold alerts/ })
    expect(toggle).toHaveAttribute("aria-describedby")
  })

  test("reflects the documented default state", () => {
    render(<SettingsForm user={owner} />)

    expect(screen.getByRole("switch", { name: /Weekly digest/ })).toBeChecked()
    expect(screen.getByRole("switch", { name: /Product updates/ })).not.toBeChecked()
  })

  test("can be toggled", async () => {
    const user = userEvent.setup()
    render(<SettingsForm user={owner} />)

    const toggle = screen.getByRole("switch", { name: /Product updates/ })
    await user.click(toggle)

    expect(toggle).toBeChecked()
  })
})

describe("SettingsForm — danger zone", () => {
  test("enables workspace deletion for the owner", () => {
    render(<SettingsForm user={owner} />)

    expect(screen.getByRole("button", { name: /Delete workspace/ })).toBeEnabled()
  })

  test("disables workspace deletion for an admin", () => {
    // Deleting a workspace is irreversible, so it is owner-only.
    render(<SettingsForm user={admin} />)

    expect(screen.getByRole("button", { name: /Delete workspace/ })).toBeDisabled()
    expect(screen.getByText(/Only the workspace owner can do this/)).toBeInTheDocument()
  })

  test("warns that deletion cannot be undone", () => {
    render(<SettingsForm user={owner} />)

    expect(screen.getByText(/This cannot be undone/)).toBeInTheDocument()
  })
})

describe("ProfileForm", () => {
  test("pre-fills the name and email", () => {
    render(<ProfileForm user={owner} />)

    expect(screen.getByLabelText("Full name")).toHaveValue("Farhan Ramadhan")
    expect(screen.getByLabelText("Email")).toHaveValue("owner@visiora.app")
  })

  test("warns that changing the email requires confirmation", () => {
    render(<ProfileForm user={owner} />)

    expect(screen.getByText(/sends a confirmation link to the new address/)).toBeInTheDocument()
  })

  test("renders a separate password-change form", () => {
    render(<ProfileForm user={owner} />)

    expect(screen.getByLabelText("Current password")).toBeInTheDocument()
    expect(screen.getByLabelText("New password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument()
  })

  test("requires the current password before allowing a change", () => {
    // Without this, an XSS or a hijacked session could silently rotate the
    // password and lock the real owner out.
    render(<ProfileForm user={owner} />)

    expect(screen.getByLabelText("Current password")).toBeRequired()
  })

  test("warns that changing the password ends other sessions", () => {
    render(<ProfileForm user={owner} />)

    expect(screen.getByText(/signs out every other device/)).toBeInTheDocument()
  })

  test("shows a busy state while saving", async () => {
    const user = userEvent.setup()
    render(<ProfileForm user={owner} />)

    await user.click(screen.getByRole("button", { name: "Save changes" }))

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled()
  })
})
