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
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "@/features/auth/api";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenants", label: "Shops", icon: Store },
  { href: "/plans", label: "Plans", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/admins", label: "Admins", icon: ShieldCheck },
];

export function AppSidebar() {
  const path = usePathname();
  const { refreshToken, clear } = useAuthStore();
  const signOut = async () => {
    try {
      if (refreshToken) await logout(refreshToken);
    } catch {}
    clear();
    window.location.href = "/login";
  };
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
