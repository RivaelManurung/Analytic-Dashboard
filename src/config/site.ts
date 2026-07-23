/**
 * Single source of truth for product identity.
 * Anything user-visible that names the product reads from here.
 */
export const siteConfig = {
  name: "Visiora",
  tagline: "Analytics Dashboard",
  description:
    "Production-grade analytics dashboard starter kit. Track followers, reach, engagement, conversion, and content performance with accessible, colorblind-safe data visualisation.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  repository: "https://github.com/your-org/analytics-dashboard",
} as const

export type SiteConfig = typeof siteConfig
