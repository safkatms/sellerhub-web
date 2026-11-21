import { RolePage } from "@/features/platform/roles/role-page";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RolePage id={id} />;
}
