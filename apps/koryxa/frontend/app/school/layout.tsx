import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { IS_V1_SIMPLE } from "@/lib/env";
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
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </div>
  );
}
