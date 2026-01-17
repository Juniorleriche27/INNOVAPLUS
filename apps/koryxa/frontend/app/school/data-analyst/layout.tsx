import type { ReactNode } from "react";
import DataAnalystSidebar from "./components/DataAnalystSidebar";
import DataAnalystViewport from "./components/DataAnalystViewport";
import { DATA_ANALYST_MODULES } from "./data";

export default function DataAnalystLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] h-full w-screen overflow-hidden px-4 sm:px-6 lg:px-8">
      <DataAnalystViewport />
      <div className="grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <DataAnalystSidebar modules={DATA_ANALYST_MODULES} />
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain pb-10 pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
