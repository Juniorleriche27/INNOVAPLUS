import type { ReactNode } from "react";

export default function AthenaShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="koryxa-school-athena h-full min-h-0 w-full overflow-visible">
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
        <div
          data-koryxa-school-sidebar
          className="min-h-0 overflow-visible lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overscroll-contain"
        >
          {sidebar}
        </div>
        <div data-koryxa-school-body className="min-h-0 overflow-y-auto overscroll-contain pb-10 pt-2 sm:pt-3 lg:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
