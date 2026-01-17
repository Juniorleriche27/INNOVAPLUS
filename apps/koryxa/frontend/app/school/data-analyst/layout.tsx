import type { ReactNode } from "react";
import DataAnalystSidebar from "./components/DataAnalystSidebar";
import { DATA_ANALYST_MODULES } from "./data";

export default function DataAnalystLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col gap-6 lg:flex-row">
      <DataAnalystSidebar modules={DATA_ANALYST_MODULES} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
