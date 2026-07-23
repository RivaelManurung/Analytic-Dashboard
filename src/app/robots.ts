import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The dashboard sits behind auth and would only ever return a redirect
      // to /login, so crawling it wastes budget. The auth pages themselves are
      // also excluded — a sign-in form has no business in an index.
      disallow: [
        "/api/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/profile",
        "/setting",
        "/billing",
        "/team-management",
        "/activity-log",
        "/notifications",
        "/reports",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
