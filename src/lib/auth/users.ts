import "server-only"

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

import type { Role, SessionUser } from "@/lib/schemas/auth"

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>

const KEY_LENGTH = 64

/**
 * Hashes a password with scrypt — memory-hard, so GPU cracking is expensive.
 *
 * scrypt ships with Node, unlike argon2/bcrypt which need a native build. For a
 * real deployment argon2id is the stronger choice; scrypt is a legitimate
 * second and is used here to keep the starter kit dependency-free.
 *
 * Each password gets its own random salt, so identical passwords produce
 * different hashes and a rainbow table is useless.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await scryptAsync(password, salt, KEY_LENGTH)
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`
}

/**
 * Verifies a password in constant time.
 *
 * `timingSafeEqual` matters: a plain `===` returns faster the earlier the first
 * mismatch is, which leaks the hash one byte at a time to an attacker who can
 * measure response time.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$")

  if (scheme !== "scrypt" || !saltHex || !hashHex) return false

  try {
    const salt = Buffer.from(saltHex, "hex")
    const expected = Buffer.from(hashHex, "hex")
    const actual = await scryptAsync(password, salt, expected.length)

    // Length must match before comparing, or timingSafeEqual throws.
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export interface StoredUser extends SessionUser {
  passwordHash: string
}

/**
 * Demo accounts.
 *
 * Hashes are computed lazily at first use rather than committed, so no password
 * hash is ever checked into version control. Replace this whole module with a
 * real user table — `findUserByEmail` is the only function callers use.
 */
const DEMO_ACCOUNTS: { user: Omit<StoredUser, "passwordHash">; password: string }[] = [
  {
    user: {
      userId: "usr_owner_001",
      email: "owner@visiora.app",
      name: "Farhan Ramadhan",
      role: "owner",
      workspace: "Aerobox Studio",
      avatarUrl: null,
    },
    password: "demo-password-owner",
  },
  {
    user: {
      userId: "usr_analyst_002",
      email: "analyst@visiora.app",
      name: "Alya Pratiwi",
      role: "analyst",
      workspace: "Aerobox Studio",
      avatarUrl: null,
    },
    password: "demo-password-analyst",
  },
  {
    user: {
      userId: "usr_viewer_003",
      email: "viewer@visiora.app",
      name: "Bima Nugroho",
      role: "viewer",
      workspace: "Aerobox Studio",
      avatarUrl: null,
    },
    password: "demo-password-viewer",
  },
]

let cache: Map<string, StoredUser> | null = null

async function getStore(): Promise<Map<string, StoredUser>> {
  if (cache) return cache

  const entries = await Promise.all(
    DEMO_ACCOUNTS.map(async ({ user, password }): Promise<[string, StoredUser]> => [
      user.email,
      { ...user, passwordHash: await hashPassword(password) },
    ])
  )

  cache = new Map(entries)
  return cache
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const store = await getStore()
  return store.get(email.trim().toLowerCase()) ?? null
}

/**
 * Registers a user in the in-memory store.
 *
 * NOTE: this is process-local and lost on restart. It exists so the sign-up
 * flow is demonstrable end to end; wire it to a database for real use.
 */
export async function createUser(input: {
  name: string
  email: string
  password: string
  role?: Role
}): Promise<StoredUser> {
  const store = await getStore()

  const user: StoredUser = {
    userId: `usr_${randomBytes(8).toString("hex")}`,
    email: input.email.trim().toLowerCase(),
    name: input.name,
    role: input.role ?? "viewer",
    workspace: "Aerobox Studio",
    avatarUrl: null,
    passwordHash: await hashPassword(input.password),
  }

  store.set(user.email, user)
  return user
}

export function toSessionUser(user: StoredUser): SessionUser {
  // Explicit field list, so a future column (passwordHash, reset token…)
  // cannot leak into the client-readable session by accident.
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    workspace: user.workspace,
    avatarUrl: user.avatarUrl,
  }
}

/** Test-only: drops the cached store so cases start from a known state. */
export function __resetUserStore(): void {
  cache = null
}
