import { SidebarProvider, SidebarTrigger } from "@sellerhub/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/features/auth/auth-guard";
import { ImpersonationBanner } from "@/features/auth/impersonation-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 p-4">
          <ImpersonationBanner />
          <SidebarTrigger className="mb-4" />
          {children}
        </main>
      </SidebarProvider>
    </AuthGuard>
  );
}
