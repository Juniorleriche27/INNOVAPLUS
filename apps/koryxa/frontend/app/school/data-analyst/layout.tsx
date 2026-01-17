import type { ReactNode } from "react";
import DataAnalystSidebar from "./components/DataAnalystSidebar";
import { DATA_ANALYST_MODULES } from "./data";

export default function DataAnalystLayout({ children }: { children: ReactNode }) {
  return (
    <div className="koryxa-data-analyst-shell h-full min-h-0 w-full overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto overscroll-contain py-6">
          <DataAnalystSidebar modules={DATA_ANALYST_MODULES} />
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain pb-10 pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
