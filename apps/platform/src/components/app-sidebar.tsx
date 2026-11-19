"use client";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  SlidersHorizontal,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  LogOut,
  ChevronDown,
  Wallet,
  LifeBuoy,
  Megaphone,
  Send,
  Wrench,
  KeyRound,
  Lock,
} from "lucide-react";
import { Perm, useCan, type PermCode } from "@/features/platform/access/api";
import { useOpenTicketCount } from "@/features/platform/ops/api";
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
import { Avatar, AvatarFallback } from "@sellerhub/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sellerhub/ui/components/dropdown-menu";
import { useSignOut } from "@/features/platform/auth/api";
import { useAuthStore } from "@/features/platform/auth/store";

const allNav: { href: string; label: string; icon: typeof Store; perm?: PermCode }[] = [
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/tenants", label: "Shops", icon: Store },
  { href: "/platform/plans", label: "Plans", icon: CreditCard },
  { href: "/platform/billing", label: "Billing", icon: Wallet },
  { href: "/platform/support", label: "Support", icon: LifeBuoy },
  { href: "/platform/announcements", label: "Announcements", icon: Megaphone },
  { href: "/platform/notifications", label: "Notifications", icon: Send },
  { href: "/platform/ops", label: "Operations", icon: Wrench },
  { href: "/platform/settings", label: "Settings", icon: SlidersHorizontal },
  { href: "/platform/logs", label: "Logs", icon: ScrollText, perm: Perm.LogsView },
  { href: "/platform/admins", label: "Admin", icon: ShieldCheck },
  { href: "/platform/roles", label: "Roles", icon: KeyRound },
];

export function AppSidebar() {
  const path = usePathname();
  const signOut = useSignOut();
  const can = useCan();
  const { data: openTickets } = useOpenTicketCount();
  const nav = allNav.filter((n) => !n.perm || can(n.perm));
  const admin = useAuthStore((s) => s.admin);
  const name = admin?.fullName || admin?.email || "Admin";
  const email = admin?.fullName ? admin?.email : undefined;

  // Move the highlight the moment a menu item is clicked, without waiting for
  // the route to load. The click only counts while we're still on the page it
  // was made from; once the path changes, the real path decides.
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  const routeHref = nav.find((n) => path.startsWith(n.href))?.href;
  const selected = pending && pending.from === path ? pending.href : routeHref;

  const menuRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLLIElement>(null);

  useLayoutEffect(() => {
    const pill = indicatorRef.current;
    const item = menuRef.current?.querySelector<HTMLElement>(
      `[data-href="${selected}"]`,
    );
    if (!pill) return;
    if (!item) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.transform = `translateY(${item.offsetTop}px)`;
    pill.style.height = `${item.offsetHeight}px`;
    pill.style.opacity = "1";
    // First placement snaps into position; later changes animate.
    if (pill.hasAttribute("data-instant")) {
      requestAnimationFrame(() => pill.removeAttribute("data-instant"));
    }
  }, [selected]);

  return (
    <Sidebar variant="sidebar" className="glass-sidebar">
      {/* Logo header */}
      <SidebarHeader className="px-4 pt-6 pb-8">
        <div className="flex items-center gap-2.5 text-white">
          <ShoppingBag className="h-6 w-6 shrink-0" strokeWidth={2.25} />
          <span className="text-xl font-semibold tracking-tight">
            SellerHub
          </span>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu ref={menuRef} className="relative gap-2">
            {/* Sliding glass pill behind the selected item */}
            <li
              ref={indicatorRef}
              aria-hidden
              data-instant=""
              className="glass-pill nav-indicator pointer-events-none absolute inset-x-0 top-0 rounded-xl opacity-0"
            />
            {nav.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href} data-href={href} className="z-[1]">
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={href === selected}
                  onClick={() => setPending({ href, from: path })}
                  className="
                    group/nav h-11 gap-3 rounded-xl px-4 text-sm font-medium
                    text-sidebar-foreground/75 transition-colors duration-300
                    hover:bg-white/8 hover:text-white
                    data-active:bg-transparent data-active:text-white
                    data-active:hover:bg-transparent
                  "
                >
                  <Icon className="h-5 w-5 shrink-0 transition-colors duration-300 group-data-active/nav:text-sidebar-primary" />
                  {label}
                  {href === "/platform/support" && Boolean(openTickets) && (
                    <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
                      {openTickets}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="glass-pill flex w-full items-center gap-3 rounded-2xl p-2.5 text-left outline-none">
            <Avatar className="h-10 w-10 ring-2 ring-white/15">
              <AvatarFallback className="bg-sidebar-primary font-semibold text-sidebar-primary-foreground">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {name}
              </div>
              {email && (
                <div className="truncate text-xs text-sidebar-foreground/60">
                  {email}
                </div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem render={<Link href="/platform/security" />} className="cursor-pointer">
              <Lock /> Security (2FA)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="cursor-pointer">
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
