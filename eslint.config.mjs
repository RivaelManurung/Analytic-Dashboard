import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // Playwright fixtures take a callback named `use`, which the React plugin
    // mistakes for the `use()` hook and rejects for being outside a component.
    files: ["e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },

  {
    // Vendored shadcn/ui primitives are upstream code. Patching them to satisfy
    // our lint rules would be overwritten by the next `shadcn add`, so they are
    // held to compilation correctness only. Anything we author stays under the
    // full ruleset.
    files: ["src/components/ui/**"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated artifacts, not source.
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
])

export default eslintConfig
