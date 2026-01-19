import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { IS_V1_SIMPLE } from "@/lib/env";
import styles from "./layout.module.css";
import AthenaShell from "@/app/school/components/AthenaShell";
import SchoolSidebar from "@/app/school/components/SchoolSidebar";
import SchoolContextHeader from "@/app/school/components/SchoolContextHeader";
const ENABLE_SCHOOL = process.env.NEXT_PUBLIC_ENABLE_SCHOOL === "true" || IS_V1_SIMPLE;

export default function SchoolLayout({ children }: { children: ReactNode }) {
  if (!ENABLE_SCHOOL) {
    notFound();
  }

  return (
    <div className={`${styles.shell} h-full min-h-0 w-full overflow-hidden`}>
      <div className="h-full min-h-0 overflow-hidden px-4 sm:px-6 lg:px-8">
        <AthenaShell
          sidebar={<SchoolSidebar />}
        >
          <div className="space-y-4">
            <SchoolContextHeader />
            {children}
          </div>
        </AthenaShell>
      </div>
    </div>
  );
}
