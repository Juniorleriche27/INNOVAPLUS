import type { ReactNode } from "react";

import MyPlanningRouteLayout from "./_components/MyPlanningRouteLayout";

export default function MyPlanningLayout({ children }: { children: ReactNode }) {
  // Cancel the root layout padding so MyPlanning controls its own full-bleed shell.
  return (
    <div className="-mb-10 -mt-6 -mx-4 sm:-mx-6 lg:-mx-8">
      <MyPlanningRouteLayout>{children}</MyPlanningRouteLayout>
    </div>
  );
}
