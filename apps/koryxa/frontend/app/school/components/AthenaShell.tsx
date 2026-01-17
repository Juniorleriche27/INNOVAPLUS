import type { ReactNode } from "react";

export default function AthenaShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="koryxa-school-athena h-full min-h-0 w-full overflow-hidden">
      <div className="grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div data-koryxa-school-sidebar className="min-h-0 overflow-y-auto overscroll-contain py-6">{sidebar}</div>
        <div data-koryxa-school-body className="min-h-0 overflow-y-auto overscroll-contain pb-10 pt-6">{children}</div>
      </div>
    </div>
  );
}
