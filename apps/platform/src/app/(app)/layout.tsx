import { SidebarProvider } from "@sellerhub/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { AuthGuard } from "@/features/platform/auth/auth-guard";
import { DisplayZoneProvider } from "@sellerhub/ui/display-zone";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-4 md:px-7">
            <DisplayZoneProvider>{children}</DisplayZoneProvider>
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
