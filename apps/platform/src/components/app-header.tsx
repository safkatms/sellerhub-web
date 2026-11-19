"use client";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, EllipsisVertical, MessageSquare, Search } from "lucide-react";
import { SidebarTrigger } from "@sellerhub/ui/components/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@sellerhub/ui/components/breadcrumb";

const labels: Record<string, string> = {
  tenants: "Shops",
  admins: "Admin",
  ops: "Operations",
  security: "Security",
};

const toLabel = (segment: string) =>
  labels[segment] ??
  decodeURIComponent(segment)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-secondary hover:text-primary";

export function AppHeader() {
  const path = usePathname();

  // /platform/tenants/new -> [tenants, new]; "platform" is the app root, not a crumb.
  const segments = path.split("/").filter(Boolean).slice(1);
  const crumbs = segments.map((seg, i) => ({
    label: toLabel(seg),
    href: "/platform/" + segments.slice(0, i + 1).join("/"),
  }));
  const currentPage = crumbs[crumbs.length - 1]?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center gap-4 bg-background/80 px-4 border-b backdrop-blur md:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="h-9 w-9 text-foreground hover:bg-secondary hover:text-primary" />

        <div className="flex min-w-0 flex-col justify-center gap-0.5">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            {currentPage}
          </h1>
          {crumbs.length > 1 && (
            <Breadcrumb>
              <BreadcrumbList className="gap-1.5 text-xs">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link href="/platform/dashboard" />}
                    className="hover:text-primary"
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {crumbs.map((crumb, i) => (
                  <Fragment key={crumb.href}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {i === crumbs.length - 1 ? (
                        <BreadcrumbPage className="font-medium">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          render={<Link href={crumb.href} />}
                          className="hover:text-primary"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
      </div>

      {/* Search (visual only for now) */}
      <button
        type="button"
        className="hidden h-10 w-72 items-center gap-2 rounded-xl border bg-muted/60 px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-muted md:flex"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="rounded-md border bg-background px-1.5 py-0.5 font-sans text-[11px] text-foreground/70">
          ⌘
        </kbd>
        <kbd className="rounded-md border bg-background px-1.5 py-0.5 font-sans text-[11px] text-foreground/70">
          K
        </kbd>
      </button>

      <div className="flex flex-1 items-center justify-end gap-1">
        <button type="button" aria-label="Messages" className={iconButton}>
          <MessageSquare className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Notifications" className={iconButton}>
          <Bell className="h-5 w-5" />
        </button>
        <button type="button" aria-label="More" className={iconButton}>
          <EllipsisVertical className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
