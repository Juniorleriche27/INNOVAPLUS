import type { ReactNode } from "react";
import ModuleTabs from "@/app/school/components/ModuleTabs";

export default function DataAnalystModuleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { module: string };
}) {
  return (
    <div className="space-y-4">
      <ModuleTabs baseHref={`/school/data-analyst/module-${params.module}`} />
      {children}
    </div>
  );
}

