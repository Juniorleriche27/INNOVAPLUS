import type { ReactNode } from "react";
import DataAnalystSidebar from "./components/DataAnalystSidebar";
import DataAnalystViewport from "./components/DataAnalystViewport";
import { DATA_ANALYST_MODULES } from "./data";

export default function DataAnalystLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-x-hidden px-4 sm:px-6 lg:px-8">
      <div className="flex min-h-0 flex-col gap-6 lg:flex-row">
        <DataAnalystViewport />
        <DataAnalystSidebar modules={DATA_ANALYST_MODULES} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
