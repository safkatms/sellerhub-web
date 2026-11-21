import { TemplatePage } from "@/features/platform/notifications/template-page";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TemplatePage id={id} />;
}
