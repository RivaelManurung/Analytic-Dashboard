import { defineConfig } from "vitest/config"

export default defineConfig({
  // Vite 8 resolves the `@/*` alias from tsconfig.json natively, and reads
  // `jsx: "react-jsx"` from it to transform JSX — so neither vite-tsconfig-paths
  // nor a React plugin is needed. (`@vitejs/plugin-react@6` would also pull in
  // Babel 8, conflicting with the Babel 7 that the `shadcn` CLI pins.)
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws by design when imported outside a Server
      // Component, which would make every module guarded by it untestable.
      // Vitest already runs in Node, so the guard has nothing to protect here.
      "server-only": new URL("./test/stubs/server-only.ts", import.meta.url).pathname,
    },
  },

  test: {
    environment: "jsdom",
    globals: true,

    // `src/lib/env.ts` validates at import time and throws without these, which
    // would make every module downstream of it unimportable. Test-only values —
    // real deployments inject them from the secret store.
    env: {
      AUTH_SECRET: "test-only-secret-at-least-32-characters-long",
      AUTH_SESSION_MAX_AGE: "86400",
      ANALYTICS_SEED: "20260101",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.d.ts",

        // Vendored shadcn primitives — upstream code, not ours to cover.
        "src/components/ui/**",

        // Next.js file conventions (pages, layouts, route handlers, proxy) are
        // integration surfaces: they wire modules together and depend on the
        // request lifecycle. Playwright covers them end to end in e2e/, which
        // catches real failures that a jsdom render of a Server Component
        // cannot. Every module they *call* stays under this gate.
        "src/app/**",
        "src/proxy.ts",

        // Static fixture data — declarations with no behaviour to assert.
        "src/lib/data/workspace.ts",
        "src/config/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
