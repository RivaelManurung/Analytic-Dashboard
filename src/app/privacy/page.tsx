import type { Metadata } from "next"

import { LegalPage } from "@/components/legal/legal-page"

// Nonce-based CSP requires dynamic rendering — see src/app/(auth)/layout.tsx.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What this starter kit stores, and what it does not.",
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="23 July 2026">
      <p>
        This project is an open-source starter kit. Run locally or from your own deployment, it
        sends nothing to the authors and has no analytics, telemetry, or third-party trackers.
      </p>

      <h2>Placeholder document</h2>
      <p>
        <strong>This page is a template, not legal advice.</strong> If you deploy something built
        from this kit and it handles real personal data, replace this text with a policy that
        reflects what your deployment actually does and satisfies the law where your users are.
      </p>

      <h2>What the demo stores</h2>
      <ul>
        <li>
          <strong>A session cookie.</strong> Signed with HS256 and set <code>httpOnly</code>,{" "}
          <code>secure</code> in production, and <code>SameSite=Lax</code>. It carries your user id,
          email, display name, role, and workspace — nothing more. It is signed, not encrypted, so
          no secret is ever placed in it.
        </li>
        <li>
          <strong>A theme preference.</strong> Stored in <code>localStorage</code> by{" "}
          <code>next-themes</code> so your light or dark choice survives a reload.
        </li>
        <li>
          <strong>Accounts you create.</strong> Held in process memory only, with the password
          hashed using scrypt and a per-user random salt. They are lost when the server restarts.
        </li>
      </ul>

      <h2>What it does not do</h2>
      <ul>
        <li>No analytics, telemetry, or session recording.</li>
        <li>No third-party cookies or advertising identifiers.</li>
        <li>No data leaves your deployment.</li>
      </ul>

      <h2>Analytics figures</h2>
      <p>
        The follower, engagement, and revenue numbers throughout the dashboard are generated from a
        fixed seed. No real account is profiled or tracked to produce them.
      </p>

      <h2>Your data</h2>
      <p>
        Since accounts live only in memory, signing out and restarting the server erases everything.
        There is no database to request deletion from.
      </p>
    </LegalPage>
  )
}
