"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconHelp,
  IconPhoto,
  IconInnerShadowTop,
  IconKey,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconUsers,
  IconWebhook,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { useAuthStore } from "@/store/auth"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("nav")
  const tUser = useTranslations("user")
  const user = useAuthStore((state) => state.user)

  const isAdmin = user?.role === "Admin"

  const navMain = [
    { title: t("dashboard"), url: "/dashboard", icon: IconDashboard },
    { title: t("schemas"), url: "/dashboard/schemas", icon: IconDatabase },
    { title: t("assets"), url: "/dashboard/assets", icon: IconPhoto },
    ...(isAdmin ? [
      { title: t("users"), url: "/dashboard/users", icon: IconUsers },
      { title: t("activity"), url: "/dashboard/audit", icon: IconListDetails },
      { title: t("analytics"), url: "/dashboard/analytics", icon: IconChartBar },
    ] : []),
  ]

  const navDocuments = [
    { name: t("aiStudio"), url: "/dashboard/chat", icon: IconFileAi },
    ...(isAdmin ? [
      { name: t("apiKeys"), url: "/dashboard/settings/api-keys", icon: IconKey },
      { name: t("webhooks"), url: "/dashboard/settings/webhooks", icon: IconWebhook },
    ] : []),
  ]

  const navSecondary = [
    { title: t("settings"), url: "/dashboard/settings", icon: IconSettings },
    { title: t("search"), url: "#", icon: IconSearch },
    { title: t("help"), url: "#", icon: IconHelp },
  ]

  const userData = {
    name: user?.username || tUser("defaultName"),
    email: user?.email || tUser("defaultEmail"),
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">CMSX</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={navDocuments} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
