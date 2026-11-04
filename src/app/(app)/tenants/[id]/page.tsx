"use client";

import { use } from "react";
import { TenantPage } from "@/features/tenants/tenant-page";

export default function TenantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TenantPage id={id} />;
}
