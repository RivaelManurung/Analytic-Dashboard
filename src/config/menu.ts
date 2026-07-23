import type { Route } from "next"
import {
  BarChart3,
  Bell,
  Bookmark,
  CheckCircle2,
  CircleGauge,
  CreditCard,
  Eye,
  FileBarChart,
  Gauge,
  Globe,
  Heart,
  Home,
  LifeBuoy,
  MessageSquare,
  Plug,
  Repeat2,
  ScrollText,
  Settings,
  Share2,
  Sparkles,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { Role } from "@/lib/schemas/auth"

export interface NavItem {
  label: string
  icon: LucideIcon
  /** `Route` comes from `next typegen`, so a typo fails the build. */
  href: Route
  /** Minimum role required to see this item. Defaults to `viewer`. */
  requiredRole?: Role
  /** Short description, surfaced in the command palette. */
  description?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: Home,
        href: "/",
        description: "Every headline metric on one screen",
      },
      {
        label: "Analytics",
        icon: BarChart3,
        href: "/analytic",
        description: "Compare metrics across a range",
      },
      {
        label: "Reports",
        icon: FileBarChart,
        href: "/reports",
        description: "Saved and scheduled reports",
        requiredRole: "analyst",
      },
    ],
  },
  {
    label: "Audience",
    items: [
      {
        label: "Followers",
        icon: Users,
        href: "/followers",
        description: "Growth, churn, and net adds",
      },
      {
        label: "Verified followers",
        icon: CheckCircle2,
        href: "/verified-followers",
        description: "Audience quality signal",
      },
      {
        label: "Profile visits",
        icon: Eye,
        href: "/profile-visits",
        description: "Traffic to your profile",
      },
      {
        label: "Impressions",
        icon: CircleGauge,
        href: "/impressions",
        description: "How often content was rendered",
      },
      {
        label: "Demographics",
        icon: Globe,
        href: "/audience",
        description: "Age, gender, and geography",
      },
    ],
  },
  {
    label: "Interaction",
    items: [
      { label: "Likes", icon: Heart, href: "/likes", description: "Likes across channels" },
      { label: "Reposts", icon: Repeat2, href: "/reposts", description: "Onward sharing" },
      { label: "Bookmarks", icon: Bookmark, href: "/bookmarks", description: "Saves over time" },
      { label: "Shares", icon: Share2, href: "/shares", description: "Direct sends" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Posts", icon: Sparkles, href: "/posts", description: "Every published post" },
      {
        label: "Replies",
        icon: MessageSquare,
        href: "/replies",
        description: "Conversation volume",
      },
    ],
  },
  {
    label: "Performance",
    items: [
      { label: "Engagement", icon: Gauge, href: "/engagement", description: "Total interactions" },
      {
        label: "Engagement rate",
        icon: CircleGauge,
        href: "/engagement-rate",
        description: "Interactions per impression",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Team",
        icon: Users,
        href: "/team-management",
        description: "Members and roles",
        requiredRole: "admin",
      },
      {
        label: "Integrations",
        icon: Plug,
        href: "/integration",
        description: "Connected channels",
        requiredRole: "admin",
      },
      {
        label: "Billing",
        icon: CreditCard,
        href: "/billing",
        description: "Plan and invoices",
        requiredRole: "owner",
      },
      {
        label: "Activity log",
        icon: ScrollText,
        href: "/activity-log",
        description: "Who changed what",
        requiredRole: "admin",
      },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", icon: UserCircle, href: "/profile", description: "Your details" },
      {
        label: "Notifications",
        icon: Bell,
        href: "/notifications",
        description: "Alerts and digests",
      },
      { label: "Settings", icon: Settings, href: "/setting", description: "Workspace preferences" },
      { label: "Help", icon: LifeBuoy, href: "/help", description: "Docs and support" },
    ],
  },
]
