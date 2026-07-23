import "server-only"

import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

import { env } from "@/lib/env"
import { sessionUserSchema, type Role, type SessionUser, hasRole } from "@/lib/schemas/auth"

export const SESSION_COOKIE = "visiora_session"

const ISSUER = "visiora.dashboard"
const AUDIENCE = "visiora.web"

/**
 * Derives the signing key on first use rather than at module load.
 *
 * `next build` imports this module to collect page data, and runtime secrets
 * are typically injected only after the build — reading AUTH_SECRET at import
 * time therefore broke the build on every platform that works that way.
 * Memoised, so the key is still derived only once per process.
 */
let cachedSecretKey: Uint8Array | null = null

function getSecretKey(): Uint8Array {
  cachedSecretKey ??= new TextEncoder().encode(env.AUTH_SECRET)
  return cachedSecretKey
}

/**
 * Signs the session as a JWT.
 *
 * The payload is signed, NOT encrypted: anyone holding the cookie can decode
 * it. Only non-sensitive identity fields go in — never a password hash, a
 * token, or PII beyond what the UI already displays.
 */
export async function createSessionToken(
  user: SessionUser,
  maxAgeSeconds: number
): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecretKey())
}

/**
 * Verifies and decodes a session token.
 *
 * Returns null for every failure mode — bad signature, expired, wrong issuer,
 * tampered payload. Callers must treat null as "not signed in" and never fall
 * back to trusting unverified claims.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"], // Pinned: prevents an `alg: none` downgrade.
    })

    // The signature proves integrity, not shape — an old token may predate a
    // schema change, so validate before handing it to the app.
    const parsed = sessionUserSchema.safeParse(payload)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export async function setSessionCookie(user: SessionUser, rememberMe = false): Promise<void> {
  // "Remember me" extends the session to 30 days; otherwise use the configured default.
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : env.AUTH_SESSION_MAX_AGE
  const token = await createSessionToken(user, maxAge)

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true, // Unreachable from JavaScript, so XSS cannot steal it.
    secure: env.NODE_ENV === "production", // http://localhost must still work in dev.
    sameSite: "lax", // Blocks cross-site POSTs while keeping normal navigation.
    path: "/",
    maxAge,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

/** Current session, or null. Safe to call from any Server Component or action. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value

  if (!token) return null
  return verifySessionToken(token)
}

/**
 * Session for a protected surface.
 *
 * `proxy.ts` already redirects unauthenticated navigation, but route handlers
 * and server actions must re-check: the proxy gates the page, not the endpoint,
 * and an API call can bypass it entirely.
 */
export async function requireSession(): Promise<SessionUser | null> {
  return getSession()
}

/** Session that also satisfies a minimum role. Returns null when it does not. */
export async function requireRole(required: Role): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session || !hasRole(session.role, required)) return null
  return session
}
