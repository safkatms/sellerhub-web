"use client";

import { use } from "react";
import { PlanPage } from "@/features/plans/plan-page";

export default function PlanDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PlanPage id={id} />;
}
