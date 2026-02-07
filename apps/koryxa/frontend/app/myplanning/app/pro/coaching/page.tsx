"use client";

import MyPlanningClient from "@/app/myplanning/MyPlanningClient";
import PlanGuard from "@/app/myplanning/components/PlanGuard";

export default function MyPlanningProCoachingPage() {
  return (
    <PlanGuard minPlan="pro" featureName="Coaching IA" ctaHref="/myplanning/pro">
      <MyPlanningClient variant="product" initialSection="coaching" />
    </PlanGuard>
  );
}
