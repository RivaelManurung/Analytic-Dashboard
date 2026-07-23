import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"

/**
 * Next.js 16 renamed the `middleware` convention to `proxy`.
 * The runtime is Node.js and is not configurable, which is what lets this file
 * verify a JWT with `jose` — the old edge runtime could not.
 */

/** Routes reachable without a session. Everything else requires one. */
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"]

/** Signed-in users are bounced away from these back to the dashboard. */
const AUTH_ROUTES = ["/login", "/register"]

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

/**
 * Builds a per-request CSP.
 *
 * The nonce allows Next.js's inline bootstrap scripts to run while any inline
 * script an attacker injects — which is the primary XSS payload vector — is
 * refused for lacking it.
 *
 * `'strict-dynamic'` is deliberately NOT used. It makes the browser ignore
 * `'self'` and every host-source, so ONLY nonced scripts load. Next.js can only
 * stamp a per-request nonce onto a *dynamically rendered* page — the docs are
 * explicit that nonces require dynamic rendering. Statically prerendered routes
 * (here: /login, /register, /terms, /privacy, /404) have their HTML built once
 * at build time, so their script tags carry no nonce, and `'strict-dynamic'`
 * blocks every Next.js chunk on exactly the pages a signed-out visitor sees.
 *
 * The trade-off of dropping it: an attacker who could plant a .js file on our
 * own origin would be allowed to load it. We host no user uploads and serve no
 * user-controlled paths, so that vector does not exist here. Inline injection,
 * the vector that does, is still blocked by the nonce.
 *
 * If you later force every route to render dynamically, you can add
 * `'strict-dynamic'` back and tighten this further.
 */
function buildCsp(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    // Dev additionally needs eval for React Fast Refresh; production must not.
    `script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ""}`,
    // Recharts and next-themes set inline styles; there is no nonce path for
    // those, so this is a documented, accepted exception.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${isDev ? "ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  return directives
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const nonce = crypto.randomUUID().replaceAll("-", "")
  const isDev = process.env.NODE_ENV === "development"
  const csp = buildCsp(nonce, isDev)

  // Next.js reads this request header to nonce its own injected scripts.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("content-security-policy", csp)

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  // Unauthenticated request for a protected page → send to login, remembering
  // where they were headed so they land there after signing in.
  if (!session && !isPublic(pathname)) {
    const loginUrl = new URL("/login", request.url)
    // Only a relative path is preserved; a full URL here would be an open redirect.
    loginUrl.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  // Already signed in and heading for login/register → straight to the dashboard.
  if (session && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("content-security-policy", csp)

  return response
}

export const config = {
  matcher: [
    /*
     * Run on everything except:
     *   api          — route handlers do their own auth and set their own headers
     *   _next/static — immutable build output
     *   _next/image  — the image optimiser
     *   static files — favicon, robots, sitemap, images, fonts
     *
     * Without this exclusion the redirect below would also intercept CSS and JS
     * requests and break the login page it is trying to render.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
}
