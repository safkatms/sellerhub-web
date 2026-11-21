import { AdminPage } from "@/features/platform/admins/admin-page";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminPage id={id} />;
}
