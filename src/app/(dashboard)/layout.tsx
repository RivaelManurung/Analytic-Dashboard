import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/layouts/dashboard-header"
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getSession } from "@/lib/auth/session"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // `proxy.ts` already gates these routes, but this is the authoritative check:
  // the proxy protects navigation, while this runs inside the render and is
  // what guarantees no page component ever sees a null user.
  const user = await getSession()
  if (!user) redirect("/login")

  return (
    // A single TooltipProvider at the root. The previous code mounted one
    // inside every metric card, which is pure duplicated overhead.
    <TooltipProvider delay={200}>
      <SidebarProvider defaultOpen>
        <DashboardSidebar user={user} />
        <SidebarInset className="min-w-0 bg-background">
          <DashboardHeader user={user} />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
