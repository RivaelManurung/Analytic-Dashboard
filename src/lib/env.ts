import "server-only"

import { z } from "zod"

/**
 * Server-side environment contract.
 *
 * Validated LAZILY — on first property access, not at module load.
 *
 * This matters for deployment: `next build` imports every route module to
 * collect page data, but platforms such as Vercel, Fly, and Kubernetes inject
 * runtime secrets *after* the build. Validating at import time made the build
 * fail with "AUTH_SECRET: expected string, received undefined" even though the
 * secret was configured correctly for runtime.
 *
 * Laziness does not weaken the guarantee. The first request that touches
 * configuration still throws a readable error, so a genuinely misconfigured
 * deployment fails immediately and loudly rather than falling back to an
 * insecure default. There is deliberately no fallback for AUTH_SECRET.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  AUTH_SECRET: z
    .string()
    .min(
      32,
      "AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48"
    ),

  AUTH_SESSION_MAX_AGE: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24),

  ANALYTICS_SEED: z.coerce.number().int().default(20260101),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | null = null

/**
 * Validates and returns the environment, memoising the result.
 * Call this from request-time code; prefer the `env` proxy for ergonomics.
 */
export function getEnv(): ServerEnv {
  if (cached) return cached

  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(
      `Invalid environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env.local and fill in the missing values.`
    )
  }

  cached = parsed.data
  return cached
}

/**
 * Ergonomic accessor. Reads like a plain object but defers validation to the
 * first property access, so merely importing this module is side-effect free.
 */
export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, property) {
    return getEnv()[property as keyof ServerEnv]
  },
  has(_target, property) {
    return property in getEnv()
  },
  ownKeys() {
    return Reflect.ownKeys(getEnv())
  },
  getOwnPropertyDescriptor(_target, property) {
    return Object.getOwnPropertyDescriptor(getEnv(), property)
  },
})

/** Test-only: drops the memoised value so cases can vary `process.env`. */
export function __resetEnvCache(): void {
  cached = null
}
