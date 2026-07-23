import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

/**
 * Only publicly reachable routes belong in a sitemap.
 *
 * Every dashboard route requires a session and redirects to /login for a
 * crawler, so listing them would advertise URLs that can never be indexed.
 */
const PUBLIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  // A fixed date keeps the output deterministic across builds, so the file
  // does not churn in version control on every rebuild.
  const lastModified = new Date("2026-07-23")

  return PUBLIC_ROUTES.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
