import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { IS_V1_SIMPLE } from "@/lib/env";
import styles from "./layout.module.css";
const ENABLE_SCHOOL = process.env.NEXT_PUBLIC_ENABLE_SCHOOL === "true" || IS_V1_SIMPLE;

export default function SchoolLayout({ children }: { children: ReactNode }) {
  if (!ENABLE_SCHOOL) {
    notFound();
  }

  // School uses an Athena-like full-bleed layout (no centered max-width container).
  // RootLayout still applies a global max-width on <main>, so we "escape" it here.
  return (
    <div className={`${styles.shell} h-full min-h-0 w-full overflow-hidden`}>
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
