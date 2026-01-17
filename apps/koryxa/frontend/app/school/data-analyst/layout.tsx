import type { ReactNode } from "react";
import { Suspense } from "react";
import { DATA_ANALYST_MODULES } from "./data";
import styles from "./layout.module.css";
import AthenaShell from "@/app/school/components/AthenaShell";
import CourseSidebar from "@/app/school/components/CourseSidebar";
import { SCHOOL_TRACKS } from "@/app/school/catalog";

export default function DataAnalystLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.shell} koryxa-data-analyst-shell h-full min-h-0 w-full overflow-hidden`}>
      <AthenaShell
        sidebar={
          <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">Chargement…</div>}>
            <CourseSidebar tracks={SCHOOL_TRACKS} trackId="data-analyst" modules={DATA_ANALYST_MODULES} />
          </Suspense>
        }
      >
        {children}
      </AthenaShell>
    </div>
  );
}
