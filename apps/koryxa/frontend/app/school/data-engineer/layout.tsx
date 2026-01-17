import type { ReactNode } from "react";
import { Suspense } from "react";
import AthenaShell from "@/app/school/components/AthenaShell";
import CourseSidebar from "@/app/school/components/CourseSidebar";
import { DATA_ENGINEER_MODULES, SCHOOL_TRACKS } from "@/app/school/catalog";

export default function DataEngineerLayout({ children }: { children: ReactNode }) {
  return (
    <AthenaShell
      sidebar={
        <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">Chargement…</div>}>
          <CourseSidebar tracks={SCHOOL_TRACKS} trackId="data-engineer" modules={DATA_ENGINEER_MODULES} />
        </Suspense>
      }
    >
      {children}
    </AthenaShell>
  );
}
