import type { NextConfig } from "next"

/**
 * Static security headers.
 *
 * Content-Security-Policy is intentionally NOT set here: it is emitted
 * per-request from `proxy.ts` so every response carries a fresh nonce.
 * A CSP defined here would be static and would force `'unsafe-inline'`.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Type `Link href` and `router.push` against the real route tree.
  typedRoutes: true,

  // Fail the production build on type errors instead of shipping them.
  // Linting is no longer part of `next build` in v16 — `next lint` was replaced
  // by the ESLint CLI, so CI runs `npm run lint` as its own step.
  typescript: { ignoreBuildErrors: false },

  /*
   * `output: "standalone"` produces a self-contained server bundle, which is
   * what you want for a small Docker image — but it is NOT compatible with
   * `next start`, which is how most people run a starter kit locally. Opting in
   * unconditionally would mean `npm run build && npm run start` warns and
   * behaves unexpectedly out of the box.
   *
   * So it is opt-in. For a container build:
   *   NEXT_OUTPUT=standalone npm run build
   *   node .next/standalone/server.js
   */
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,

  poweredByHeader: false,

  experimental: {
    // Enables `forbidden()` / `unauthorized()` and their file conventions, so a
    // role-gated page can return a real 403 instead of faking a 404.
    authInterrupts: true,
    // Reuse Turbopack compiler artifacts across dev restarts.
    turbopackFileSystemCacheForDev: true,
    // Tree-shake barrel imports from the icon/chart/date packages.
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 narrowed the `qualities` default to [75]; exports need a high tier.
    qualities: [75, 90],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig

/*
 * =============================================
 *  ⚠️  OS File Watch Limit Error Fix
 * =============================================
 * Jika error "OS file watch limit reached" muncul,
 * jalankan perintah berikut di terminal:
 *
 *   sudo sysctl -w fs.inotify.max_user_watches=524288
 *   echo 'fs.inotify.max_user_watches=524288' | sudo tee /etc/sysctl.d/10-inotify-max-user-watches.conf
 *   sudo sysctl -p /etc/sysctl.d/10-inotify-max-user-watches.conf
 *
 * Atau matikan dulu proses Next.js yang masih berjalan:
 *   pkill -f "next dev"
 */
