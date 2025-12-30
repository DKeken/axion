"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Server, Rocket } from "lucide-react";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";
import { ROUTES } from "@/config/routes";

// Menu items.
const items = [
  {
    title: "Проекты",
    url: ROUTES.DASHBOARD.PROJECTS.ROOT,
    icon: LayoutDashboard,
  },
  {
    title: "Инфраструктура",
    url: ROUTES.DASHBOARD.INFRASTRUCTURE.ROOT,
    icon: Server,
  },
  {
    title: "Развертывания",
    url: ROUTES.DASHBOARD.DEPLOYMENTS.ROOT,
    icon: Rocket,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          Axion Stack
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Платформа</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
