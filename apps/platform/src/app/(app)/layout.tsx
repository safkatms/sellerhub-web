import { SidebarProvider, SidebarTrigger } from "@sellerhub/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/features/platform/auth/auth-guard";
import { DisplayZoneProvider } from "@/features/platform/auth/display-zone";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 p-4">
          <SidebarTrigger className="mb-4" />
          <DisplayZoneProvider>{children}</DisplayZoneProvider>
        </main>
      </SidebarProvider>
    </AuthGuard>
  );
}
