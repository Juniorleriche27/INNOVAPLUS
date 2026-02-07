"use client";

import MyPlanningClient from "@/app/myplanning/MyPlanningClient";
import PlanGuard from "@/app/myplanning/components/PlanGuard";

export default function MyPlanningProStatsPage() {
  return (
    <PlanGuard minPlan="pro" featureName="Stats & graphiques" ctaHref="/myplanning/pro">
      <MyPlanningClient variant="product" initialSection="stats" />
    </PlanGuard>
  );
}
