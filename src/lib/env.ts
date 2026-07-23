import "server-only"

import { z } from "zod"

/**
 * Server-side environment contract.
 *
 * Validated once at module load so a misconfigured deployment fails at boot
 * with a readable message, rather than at the first request with a stack trace.
 * There is deliberately no insecure fallback for AUTH_SECRET.
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

function loadServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env.local and fill in the missing values.`
    )
  }

  return parsed.data
}

export const env = loadServerEnv()

export type ServerEnv = typeof env
