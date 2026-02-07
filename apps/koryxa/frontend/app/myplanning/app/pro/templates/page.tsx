"use client";

import MyPlanningClient from "@/app/myplanning/MyPlanningClient";
import PlanGuard from "@/app/myplanning/components/PlanGuard";

export default function MyPlanningProTemplatesPage() {
  return (
    <PlanGuard minPlan="pro" featureName="Templates universels" ctaHref="/myplanning/pro">
      <MyPlanningClient variant="product" initialSection="templates" />
    </PlanGuard>
  );
}
