import { AnnouncementPage } from "@/features/platform/announcements/announcements-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnnouncementPage id={id} />;
}
