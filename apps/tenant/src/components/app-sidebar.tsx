"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, KeyRound, LayoutDashboard, LifeBuoy, LogOut, Wallet } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@sellerhub/ui/components/sidebar";
import { useSignOut } from "@/features/auth/api";
import { useActiveSession } from "@/features/auth/store";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/billing", label: "Billing", icon: Wallet },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/account-data", label: "Data & account", icon: Database },
];

export function AppSidebar() {
  const path = usePathname();
  const signOut = useSignOut();
  const { impersonating } = useActiveSession();
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3 font-semibold">SellerHub</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {nav.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton render={<Link href={href} />} isActive={path.startsWith(href)}>
                  <Icon /> {label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {!impersonating && (
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/change-password" />} isActive={path === "/change-password"}>
                <KeyRound /> Change password
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut /> {impersonating ? "End impersonation" : "Sign out"}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
