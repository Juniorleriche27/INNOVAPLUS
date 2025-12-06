import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const ENABLE_SCHOOL = process.env.NEXT_PUBLIC_ENABLE_SCHOOL === "true";

export default function SchoolLayout({ children }: { children: ReactNode }) {
  if (!ENABLE_SCHOOL) {
    notFound();
  }
  return children;
}
