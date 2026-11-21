import { BillingSummary } from "@/features/platform/billing/billing-summary";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <BillingSummary />
      {children}
    </div>
  );
}
