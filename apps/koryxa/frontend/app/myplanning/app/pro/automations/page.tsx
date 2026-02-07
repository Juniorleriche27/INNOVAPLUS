"use client";

import MyPlanningClient from "@/app/myplanning/MyPlanningClient";
import PlanGuard from "@/app/myplanning/components/PlanGuard";

export default function MyPlanningProAutomationsPage() {
  return (
    <PlanGuard minPlan="pro" featureName="Automatisations" ctaHref="/myplanning/pro">
      <MyPlanningClient variant="product" initialSection="automations" />
    </PlanGuard>
  );
}
