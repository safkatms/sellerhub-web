"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  ChevronRight,
  Wallet,
  LifeBuoy,
  Megaphone,
  Send,
  Wrench,
  KeyRound,
  Lock,
} from "lucide-react";
import {
  Perm,
  PermModule,
  useCan,
  useCanModule,
  type PermCode,
  type PermModuleCode,
} from "@/features/platform/roles/api";
import { useOpenTicketCount } from "@/features/platform/ops/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@sellerhub/ui/components/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sellerhub/ui/components/collapsible";
import { Avatar, AvatarFallback } from "@sellerhub/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sellerhub/ui/components/dropdown-menu";
import { useSignOut } from "@/features/platform/auth/api";
import { useAuthStore } from "@/features/platform/auth/store";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Store;
  code?: PermCode;
  module?: PermModuleCode;
  children?: { href: string; label: string }[];
};

const allNav: NavItem[] = [
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/platform/tenants",
    label: "Shops",
    icon: Store,
    module: PermModule.Tenant,
  },
  {
    href: "/platform/plans",
    label: "Plans",
    icon: CreditCard,
    module: PermModule.Plan,
  },
  {
    href: "/platform/billing",
    label: "Billing",
    icon: Wallet,
    module: PermModule.Billing,
    children: [
      { href: "/platform/billing/requests", label: "Payment requests" },
      { href: "/platform/billing/invoices", label: "Invoices" },
      { href: "/platform/billing/coupons", label: "Coupons" },
    ],
  },
  {
    href: "/platform/support",
    label: "Support",
    icon: LifeBuoy,
    module: PermModule.Support,
  },
  {
    href: "/platform/announcements",
    label: "Announcements",
    icon: Megaphone,
    code: Perm.AnnouncementManage,
  },
  {
    href: "/platform/notifications",
    label: "Notifications",
    icon: Send,
    code: Perm.NotificationManage,
    children: [
      { href: "/platform/notifications/messages", label: "Messages" },
      { href: "/platform/notifications/usage", label: "SMS usage" },
      { href: "/platform/notifications/templates", label: "Templates" },
    ],
  },
  {
    href: "/platform/ops",
    label: "Operations",
    icon: Wrench,
    module: PermModule.Ops,
    children: [
      { href: "/platform/ops/data-requests", label: "Data requests" },
      { href: "/platform/ops/jobs", label: "Background jobs" },
    ],
  },
  {
    href: "/platform/settings",
    label: "Settings",
    icon: SlidersHorizontal,
    module: PermModule.Settings,
  },
  {
    href: "/platform/logs",
    label: "Logs",
    icon: ScrollText,
    module: PermModule.Logs,
    children: [
      { href: "/platform/logs/audit", label: "Audit" },
      { href: "/platform/logs/logins", label: "Logins" },
      { href: "/platform/logs/errors", label: "Errors" },
      { href: "/platform/logs/impersonations", label: "Login as shop" },
    ],
  },
  {
    href: "/platform/admins",
    label: "Admin",
    icon: ShieldCheck,
    module: PermModule.Admin,
  },
  {
    href: "/platform/roles",
    label: "Roles",
    icon: KeyRound,
    module: PermModule.Admin,
  },
];

const buttonCls = `
  group/nav h-11 gap-3 rounded-xl px-4 text-sm font-medium
  text-sidebar-foreground/75 transition-colors duration-300
  hover:bg-white/8 hover:text-white
  data-active:bg-transparent data-active:text-white
  data-active:hover:bg-transparent
`;
const iconCls =
  "h-5 w-5 shrink-0 transition-colors duration-300 group-data-active/nav:text-sidebar-primary";
const subButtonCls = `
  h-9 rounded-xl px-3 text-sm font-medium
  text-sidebar-foreground/70 transition-colors duration-300
  hover:bg-white/8 hover:text-white
  data-active:bg-transparent data-active:text-white
  data-active:hover:bg-transparent
`;

export function AppSidebar() {
  const path = usePathname();
  const signOut = useSignOut();
  const can = useCan();
  const canModule = useCanModule();
  const { data: openTickets } = useOpenTicketCount();
  const nav = allNav.filter(
    (n) =>
      (!n.module && !n.code) ||
      (n.module ? canModule(n.module) : false) ||
      (n.code ? can(n.code) : false),
  );
  const admin = useAuthStore((s) => s.admin);
  const name = admin?.fullName || admin?.email || "Admin";
  const email = admin?.fullName ? admin?.email : undefined;

  // Groups open by default while the current route is inside them; the user can toggle.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (n: NavItem) => open[n.href] ?? path.startsWith(n.href);

  // Move the highlight the moment a menu item is clicked, without waiting for
  // the route to load. The click only counts while we're still on the page it
  // was made from; once the path changes, the real path decides.
  const [pending, setPending] = useState<{ href: string; from: string } | null>(
    null,
  );
  const selectable = nav.flatMap((n) => n.children ?? [n]);
  const routeHref = selectable.find((n) => path.startsWith(n.href))?.href;
  const selected = pending && pending.from === path ? pending.href : routeHref;

  // A collapsed group carries the highlight when one of its children is selected.
  const parentOfSelected = nav.find((n) =>
    n.children?.some((c) => c.href === selected),
  );
  const target =
    parentOfSelected && !isOpen(parentOfSelected)
      ? parentOfSelected.href
      : selected;

  const menuRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLLIElement>(null);

  const place = useCallback(() => {
    const pill = indicatorRef.current;
    const menu = menuRef.current;
    if (!pill || !menu) return;
    const item = target
      ? menu.querySelector<HTMLElement>(`[data-href="${target}"]`)
      : null;
    if (!item) {
      pill.style.opacity = "0";
      return;
    }
    const top =
      item.getBoundingClientRect().top - menu.getBoundingClientRect().top;
    pill.style.transform = `translateY(${top}px)`;
    pill.style.height = `${item.offsetHeight}px`;
    pill.style.opacity = "1";
    // First placement snaps into position; later changes animate.
    if (pill.hasAttribute("data-instant")) {
      requestAnimationFrame(() => pill.removeAttribute("data-instant"));
    }
  }, [target]);

  useLayoutEffect(() => {
    place();
  }, [place, open, path]);

  // Keep the highlight aligned while groups expand or collapse.
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const ro = new ResizeObserver(place);
    ro.observe(menu);
    return () => ro.disconnect();
  }, [place]);

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

            {nav.map((n) => {
              const { href, label, icon: Icon, children } = n;

              if (!children) {
                return (
                  <SidebarMenuItem
                    key={href}
                    data-href={href}
                    className="z-[1]"
                  >
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={href === selected}
                      onClick={() => setPending({ href, from: path })}
                      className={buttonCls}
                    >
                      <Icon className={iconCls} />
                      {label}
                    </SidebarMenuButton>
                    {href === "/platform/support" && Boolean(openTickets) && (
                      <SidebarMenuBadge className="rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                        {openTickets}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              }

              const expanded = isOpen(n);
              const childActive = children.some((c) => c.href === selected);
              return (
                <Collapsible
                  key={href}
                  open={expanded}
                  onOpenChange={(o: any) =>
                    setOpen((prev) => ({ ...prev, [href]: o }))
                  }
                  className="group/collapsible"
                >
                  <SidebarMenuItem className="z-[1]">
                    <SidebarMenuButton
                      render={<CollapsibleTrigger />}
                      data-href={href}
                      isActive={!expanded && childActive}
                      className={buttonCls}
                    >
                      <Icon className={iconCls} />
                      {label}
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub className="mx-0 mt-1 ml-7 gap-1 border-white/10 pr-0">
                        {children.map((c) => (
                          <SidebarMenuSubItem
                            key={c.href}
                            data-href={c.href}
                            className="relative z-[1]"
                          >
                            <SidebarMenuSubButton
                              render={<Link href={c.href} />}
                              isActive={c.href === selected}
                              onClick={() =>
                                setPending({ href: c.href, from: path })
                              }
                              className={subButtonCls}
                            >
                              {c.label}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
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
            <DropdownMenuItem
              render={<Link href="/platform/security" />}
              className="cursor-pointer"
            >
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
