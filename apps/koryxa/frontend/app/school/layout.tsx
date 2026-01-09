import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { IS_V1_SIMPLE } from "@/lib/env";
import SchoolSidebar from "@/components/school/SchoolSidebar";

const ENABLE_SCHOOL = process.env.NEXT_PUBLIC_ENABLE_SCHOOL === "true" || IS_V1_SIMPLE;

export default function SchoolLayout({ children }: { children: ReactNode }) {
  if (!ENABLE_SCHOOL) {
    notFound();
  }

  if (!IS_V1_SIMPLE) {
    return children;
  }

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
        <SchoolSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
