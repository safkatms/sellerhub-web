import { CouponPage } from "@/features/platform/billing/coupon-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CouponPage id={id} />;
}
