import type { ReactNode } from "react";

import MyPlanningRouteLayout from "./_components/MyPlanningRouteLayout";

export default function MyPlanningLayout({ children }: { children: ReactNode }) {
  // Root padding is already neutralized in global CSS for #content; keep wrapper neutral.
  return (
    <div className="w-full">
      <MyPlanningRouteLayout>{children}</MyPlanningRouteLayout>
    </div>
  );
}
