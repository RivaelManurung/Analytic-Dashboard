/**
 * @vitest-environment node
 *
 * Must run in Node, not jsdom. jsdom provides its own `TextEncoder` whose
 * `Uint8Array` belongs to a different realm, so jose's `instanceof Uint8Array`
 * check on the signing key fails. This is a test-environment artefact — the
 * same code signs correctly in the Next.js Node runtime.
 */
import { describe, expect, test, vi } from "vitest"
import { SignJWT } from "jose"

import { createSessionToken, verifySessionToken } from "@/lib/auth/session"
import type { SessionUser } from "@/lib/schemas/auth"

// `next/headers` is only available inside a request scope, so the cookie
// helpers are exercised via Playwright. The signing and verification logic —
// which is the security-critical part — is pure and tested here.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}))

const user: SessionUser = {
  userId: "usr_001",
  email: "owner@visiora.app",
  name: "Farhan Ramadhan",
  role: "owner",
  workspace: "Aerobox Studio",
  avatarUrl: null,
}

const SECRET = new TextEncoder().encode("test-only-secret-at-least-32-characters-long")

describe("createSessionToken", () => {
  test("produces a three-part JWT", async () => {
    const token = await createSessionToken(user, 3600)

    expect(token.split(".")).toHaveLength(3)
  })

  test("round-trips through verification", async () => {
    const token = await createSessionToken(user, 3600)

    await expect(verifySessionToken(token)).resolves.toMatchObject(user)
  })
})

describe("verifySessionToken — rejection cases", () => {
  test("rejects a token with a tampered payload", async () => {
    // The signature is what makes the role claim trustworthy. Without this
    // check a user could edit their own cookie and become an owner.
    const token = await createSessionToken({ ...user, role: "viewer" }, 3600)
    const [header, , signature] = token.split(".")

    const forged = Buffer.from(JSON.stringify({ ...user, role: "owner" }))
      .toString("base64url")
      .replace(/=+$/, "")

    await expect(verifySessionToken(`${header}.${forged}.${signature}`)).resolves.toBeNull()
  })

  test("rejects a token signed with a different secret", async () => {
    const foreign = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("visiora.dashboard")
      .setAudience("visiora.web")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("a-completely-different-secret-key-here"))

    await expect(verifySessionToken(foreign)).resolves.toBeNull()
  })

  test("rejects an expired token", async () => {
    const expired = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setIssuer("visiora.dashboard")
      .setAudience("visiora.web")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(SECRET)

    await expect(verifySessionToken(expired)).resolves.toBeNull()
  })

  test("rejects a token from the wrong issuer", async () => {
    const wrongIssuer = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("someone-else")
      .setAudience("visiora.web")
      .setExpirationTime("1h")
      .sign(SECRET)

    await expect(verifySessionToken(wrongIssuer)).resolves.toBeNull()
  })

  test("rejects a token for the wrong audience", async () => {
    const wrongAudience = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("visiora.dashboard")
      .setAudience("some-other-app")
      .setExpirationTime("1h")
      .sign(SECRET)

    await expect(verifySessionToken(wrongAudience)).resolves.toBeNull()
  })

  test("rejects a validly signed token whose payload fails the schema", async () => {
    // A signature proves integrity, not shape. An old token predating a schema
    // change must not be handed to the app half-populated.
    const malformed = await new SignJWT({ userId: "usr_1", role: "wizard" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("visiora.dashboard")
      .setAudience("visiora.web")
      .setExpirationTime("1h")
      .sign(SECRET)

    await expect(verifySessionToken(malformed)).resolves.toBeNull()
  })

  test("rejects garbage instead of throwing", async () => {
    await expect(verifySessionToken("not-a-token")).resolves.toBeNull()
    await expect(verifySessionToken("")).resolves.toBeNull()
    await expect(verifySessionToken("a.b.c")).resolves.toBeNull()
  })

  test("rejects an unsigned `alg: none` token", async () => {
    // The classic JWT downgrade attack: strip the signature and claim the
    // token needs none. Pinning algorithms to HS256 is what blocks it.
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")
    const payload = Buffer.from(JSON.stringify({ ...user })).toString("base64url")

    await expect(verifySessionToken(`${header}.${payload}.`)).resolves.toBeNull()
  })
})
