import "server-only"

import type { Role } from "@/lib/schemas/auth"
import type { PostChannel } from "@/lib/schemas/analytics"

/**
 * Static workspace fixtures.
 *
 * Unlike the analytics figures these do not vary with the reporting period, so
 * they are plain constants rather than generated. Replace with real tables when
 * wiring a database — the shapes are the contract the UI depends on.
 */

export interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  status: "active" | "invited" | "suspended"
  lastActiveAt: string
  joinedAt: string
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "usr_owner_001",
    name: "Farhan Ramadhan",
    email: "owner@visiora.app",
    role: "owner",
    status: "active",
    lastActiveAt: "2026-07-23",
    joinedAt: "2024-02-11",
  },
  {
    id: "usr_analyst_002",
    name: "Alya Pratiwi",
    email: "analyst@visiora.app",
    role: "analyst",
    status: "active",
    lastActiveAt: "2026-07-22",
    joinedAt: "2024-06-03",
  },
  {
    id: "usr_viewer_003",
    name: "Bima Nugroho",
    email: "viewer@visiora.app",
    role: "viewer",
    status: "active",
    lastActiveAt: "2026-07-20",
    joinedAt: "2025-01-19",
  },
  {
    id: "usr_admin_004",
    name: "Citra Dewi",
    email: "citra@visiora.app",
    role: "admin",
    status: "active",
    lastActiveAt: "2026-07-23",
    joinedAt: "2024-09-27",
  },
  {
    id: "usr_pending_005",
    name: "Dimas Saputra",
    email: "dimas@visiora.app",
    role: "analyst",
    status: "invited",
    lastActiveAt: "—",
    joinedAt: "2026-07-18",
  },
  {
    id: "usr_suspended_006",
    name: "Eka Wulandari",
    email: "eka@visiora.app",
    role: "viewer",
    status: "suspended",
    lastActiveAt: "2026-04-02",
    joinedAt: "2025-03-14",
  },
]

export interface Integration {
  id: PostChannel | string
  name: string
  category: "Social" | "Commerce" | "Automation" | "Data"
  description: string
  connected: boolean
  lastSyncedAt: string | null
  accountLabel: string | null
}

export const INTEGRATIONS: Integration[] = [
  {
    id: "x",
    name: "X",
    category: "Social",
    description: "Import posts, replies, reposts, and impressions.",
    connected: true,
    lastSyncedAt: "2026-07-23 08:12",
    accountLabel: "@aeroboxstudio",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "Social",
    description: "Sync reels, stories, and profile insights.",
    connected: true,
    lastSyncedAt: "2026-07-23 07:55",
    accountLabel: "@aerobox.studio",
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "Social",
    description: "Track video views, watch time, and shares.",
    connected: true,
    lastSyncedAt: "2026-07-22 23:40",
    accountLabel: "@aeroboxstudio",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "Social",
    description: "Company page impressions and follower growth.",
    connected: false,
    lastSyncedAt: null,
    accountLabel: null,
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Social",
    description: "Channel analytics, watch time, and subscribers.",
    connected: false,
    lastSyncedAt: null,
    accountLabel: null,
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "Commerce",
    description: "Attribute orders and revenue back to social traffic.",
    connected: true,
    lastSyncedAt: "2026-07-23 06:30",
    accountLabel: "aerobox.myshopify.com",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Automation",
    description: "Post daily digests and threshold alerts to a channel.",
    connected: false,
    lastSyncedAt: null,
    accountLabel: null,
  },
  {
    id: "bigquery",
    name: "BigQuery",
    category: "Data",
    description: "Stream raw events into your own warehouse.",
    connected: false,
    lastSyncedAt: null,
    accountLabel: null,
  },
]

export interface ActivityEntry {
  id: string
  actor: string
  action: string
  target: string
  category: "auth" | "data" | "settings" | "team" | "billing"
  at: string
  ip: string
}

export const ACTIVITY_LOG: ActivityEntry[] = [
  {
    id: "act_001",
    actor: "Farhan Ramadhan",
    action: "Exported",
    target: "Post performance (CSV)",
    category: "data",
    at: "2026-07-23 09:14",
    ip: "103.94.12.8",
  },
  {
    id: "act_002",
    actor: "Citra Dewi",
    action: "Invited",
    target: "dimas@visiora.app as Analyst",
    category: "team",
    at: "2026-07-18 14:02",
    ip: "103.94.12.44",
  },
  {
    id: "act_003",
    actor: "Alya Pratiwi",
    action: "Signed in",
    target: "Web session",
    category: "auth",
    at: "2026-07-22 08:31",
    ip: "182.253.44.19",
  },
  {
    id: "act_004",
    actor: "Farhan Ramadhan",
    action: "Connected",
    target: "Shopify integration",
    category: "settings",
    at: "2026-07-15 11:47",
    ip: "103.94.12.8",
  },
  {
    id: "act_005",
    actor: "Citra Dewi",
    action: "Suspended",
    target: "eka@visiora.app",
    category: "team",
    at: "2026-04-02 16:20",
    ip: "103.94.12.44",
  },
  {
    id: "act_006",
    actor: "Farhan Ramadhan",
    action: "Updated",
    target: "Billing plan to Scale",
    category: "billing",
    at: "2026-03-01 10:05",
    ip: "103.94.12.8",
  },
  {
    id: "act_007",
    actor: "Alya Pratiwi",
    action: "Created",
    target: "Weekly engagement report",
    category: "data",
    at: "2026-07-21 17:38",
    ip: "182.253.44.19",
  },
  {
    id: "act_008",
    actor: "Bima Nugroho",
    action: "Signed in",
    target: "Web session",
    category: "auth",
    at: "2026-07-20 09:02",
    ip: "36.72.211.5",
  },
]

export interface SavedReport {
  id: string
  name: string
  description: string
  schedule: "Daily" | "Weekly" | "Monthly" | "Manual"
  recipients: number
  lastRunAt: string
  format: "PDF" | "CSV" | "Email digest"
  owner: string
}

export const SAVED_REPORTS: SavedReport[] = [
  {
    id: "rep_001",
    name: "Weekly engagement digest",
    description: "Headline metrics plus the five best-performing posts.",
    schedule: "Weekly",
    recipients: 8,
    lastRunAt: "2026-07-21",
    format: "Email digest",
    owner: "Alya Pratiwi",
  },
  {
    id: "rep_002",
    name: "Monthly board pack",
    description: "Revenue attribution, funnel conversion, and audience growth.",
    schedule: "Monthly",
    recipients: 4,
    lastRunAt: "2026-07-01",
    format: "PDF",
    owner: "Farhan Ramadhan",
  },
  {
    id: "rep_003",
    name: "Raw post export",
    description: "Every post with full interaction counts, for the warehouse.",
    schedule: "Daily",
    recipients: 1,
    lastRunAt: "2026-07-23",
    format: "CSV",
    owner: "Farhan Ramadhan",
  },
  {
    id: "rep_004",
    name: "Campaign retro — Ramadan",
    description: "One-off analysis of the March campaign window.",
    schedule: "Manual",
    recipients: 6,
    lastRunAt: "2026-04-08",
    format: "PDF",
    owner: "Citra Dewi",
  },
]

export interface Invoice {
  id: string
  number: string
  issuedAt: string
  amountUsd: number
  status: "paid" | "due" | "failed"
  period: string
}

export const INVOICES: Invoice[] = [
  {
    id: "inv_07",
    number: "VIS-2026-07",
    issuedAt: "2026-07-01",
    amountUsd: 499,
    status: "paid",
    period: "Jul 2026",
  },
  {
    id: "inv_06",
    number: "VIS-2026-06",
    issuedAt: "2026-06-01",
    amountUsd: 499,
    status: "paid",
    period: "Jun 2026",
  },
  {
    id: "inv_05",
    number: "VIS-2026-05",
    issuedAt: "2026-05-01",
    amountUsd: 499,
    status: "paid",
    period: "May 2026",
  },
  {
    id: "inv_04",
    number: "VIS-2026-04",
    issuedAt: "2026-04-01",
    amountUsd: 299,
    status: "paid",
    period: "Apr 2026",
  },
  {
    id: "inv_03",
    number: "VIS-2026-03",
    issuedAt: "2026-03-01",
    amountUsd: 299,
    status: "failed",
    period: "Mar 2026",
  },
]

export interface NotificationItem {
  id: string
  title: string
  body: string
  severity: "info" | "success" | "warning"
  at: string
  read: boolean
}

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "ntf_001",
    title: "Engagement rate up 18% week over week",
    body: "Driven mainly by TikTok. Your Thursday post accounts for a third of the lift.",
    severity: "success",
    at: "2026-07-23 08:00",
    read: false,
  },
  {
    id: "ntf_002",
    title: "LinkedIn sync has not run in 30 days",
    body: "The integration is disconnected, so LinkedIn figures are missing from every report.",
    severity: "warning",
    at: "2026-07-22 06:00",
    read: false,
  },
  {
    id: "ntf_003",
    title: "Weekly digest sent to 8 recipients",
    body: "The 21 July engagement digest was delivered successfully.",
    severity: "info",
    at: "2026-07-21 07:00",
    read: false,
  },
  {
    id: "ntf_004",
    title: "Follower growth crossed 2.1M",
    body: "You passed the 2.1 million follower mark on 14 July.",
    severity: "success",
    at: "2026-07-14 12:30",
    read: true,
  },
  {
    id: "ntf_005",
    title: "Invoice VIS-2026-03 failed",
    body: "The March payment was retried and settled on 3 March.",
    severity: "warning",
    at: "2026-03-01 09:15",
    read: true,
  },
]
