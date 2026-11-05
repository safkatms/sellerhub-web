"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  SlidersHorizontal,
  ScrollText,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/features/platform/auth/api";

const nav = [
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/tenants", label: "Shops", icon: Store },
  { href: "/platform/plans", label: "Plans", icon: CreditCard },
  { href: "/platform/settings", label: "Settings", icon: SlidersHorizontal },
  { href: "/platform/logs", label: "Logs", icon: ScrollText },
  { href: "/platform/admins", label: "Admins", icon: ShieldCheck },
];

export function AppSidebar() {
  const path = usePathname();
  const signOut = useSignOut();
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3 font-semibold">
        SellerHub Platform
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {nav.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={path.startsWith(href)}
                >
                  <Icon /> {label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton onClick={signOut}>
          <LogOut /> Sign out
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
