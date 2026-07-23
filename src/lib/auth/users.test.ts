import { beforeEach, describe, expect, test } from "vitest"

import {
  __resetUserStore,
  createUser,
  findUserByEmail,
  hashPassword,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth/users"

beforeEach(() => {
  __resetUserStore()
})

describe("hashPassword", () => {
  test("never stores the password in the hash", () => {
    // The single most important property here.
    return hashPassword("super-secret-password").then((hash) => {
      expect(hash).not.toContain("super-secret-password")
    })
  })

  test("uses the labelled scrypt format", async () => {
    const hash = await hashPassword("a-long-enough-password")
    const [scheme, salt, digest] = hash.split("$")

    expect(scheme).toBe("scrypt")
    expect(salt).toMatch(/^[0-9a-f]{32}$/)
    expect(digest).toMatch(/^[0-9a-f]{128}$/)
  })

  test("produces a different hash for the same password each time", async () => {
    // Per-password random salt: identical passwords must not collide, or a
    // rainbow table cracks every account at once.
    const [a, b] = await Promise.all([hashPassword("same-password"), hashPassword("same-password")])

    expect(a).not.toBe(b)
  })
})

describe("verifyPassword", () => {
  test("accepts the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple")
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true)
  })

  test("rejects the wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple")
    expect(await verifyPassword("wrong horse battery staple", hash)).toBe(false)
  })

  test("rejects a near-miss differing by one character", async () => {
    const hash = await hashPassword("a-long-enough-password")
    expect(await verifyPassword("a-long-enough-passwordX", hash)).toBe(false)
  })

  test("returns false rather than throwing on a malformed stored hash", async () => {
    // The login action deliberately calls this with a dummy hash for unknown
    // accounts, so it must never throw.
    expect(await verifyPassword("anything", "scrypt$00$00")).toBe(false)
    expect(await verifyPassword("anything", "garbage")).toBe(false)
    expect(await verifyPassword("anything", "")).toBe(false)
  })

  test("rejects an unknown hashing scheme instead of trusting it", async () => {
    expect(await verifyPassword("anything", "md5$abc$def")).toBe(false)
  })
})

describe("findUserByEmail", () => {
  test("finds a seeded demo account", async () => {
    const user = await findUserByEmail("owner@visiora.app")

    expect(user).not.toBeNull()
    expect(user?.role).toBe("owner")
  })

  test("matches case-insensitively and ignores surrounding whitespace", async () => {
    expect(await findUserByEmail("  OWNER@VISIORA.APP  ")).not.toBeNull()
  })

  test("returns null for an unknown address", async () => {
    expect(await findUserByEmail("nobody@example.com")).toBeNull()
  })

  test("stores demo passwords hashed, never in plaintext", async () => {
    const user = await findUserByEmail("owner@visiora.app")

    expect(user?.passwordHash).toMatch(/^scrypt\$/)
    expect(user?.passwordHash).not.toContain("demo-password-owner")
    expect(await verifyPassword("demo-password-owner", user!.passwordHash)).toBe(true)
  })
})

describe("createUser", () => {
  test("creates a retrievable user with the default viewer role", async () => {
    const created = await createUser({
      name: "New Person",
      email: "New.Person@Example.com",
      password: "a-long-enough-password",
    })

    expect(created.role).toBe("viewer")
    // Least privilege by default: a self-registered account must not land as admin.
    expect(created.email).toBe("new.person@example.com")
    expect(await findUserByEmail("new.person@example.com")).not.toBeNull()
  })

  test("hashes the password on creation", async () => {
    const created = await createUser({
      name: "New Person",
      email: "hash@example.com",
      password: "a-long-enough-password",
    })

    expect(created.passwordHash).not.toContain("a-long-enough-password")
    expect(await verifyPassword("a-long-enough-password", created.passwordHash)).toBe(true)
  })

  test("gives each user a distinct id", async () => {
    const a = await createUser({ name: "A", email: "a@x.co", password: "a-long-enough-password" })
    const b = await createUser({ name: "B", email: "b@x.co", password: "a-long-enough-password" })

    expect(a.userId).not.toBe(b.userId)
  })
})

describe("toSessionUser", () => {
  test("strips the password hash from the session payload", async () => {
    // The session is signed but not encrypted, so anything here is readable by
    // the client. A leaked hash would be an offline cracking target.
    const stored = await findUserByEmail("owner@visiora.app")
    const session = toSessionUser(stored!)

    expect(session).not.toHaveProperty("passwordHash")
    expect(Object.keys(session).sort()).toEqual([
      "avatarUrl",
      "email",
      "name",
      "role",
      "userId",
      "workspace",
    ])
  })
})
