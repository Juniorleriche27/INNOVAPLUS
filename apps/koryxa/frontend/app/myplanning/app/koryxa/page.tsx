import { Suspense } from "react";

import KoryxaCockpitClient from "./KoryxaCockpitClient";

function KoryxaCockpitFallback() {
  return (
    <section className="grid gap-4">
      <div className="h-28 animate-pulse rounded-[32px] bg-white" />
      <div className="h-48 animate-pulse rounded-[32px] bg-white" />
    </section>
  );
}

export default function KoryxaCockpitPage() {
  return (
    <Suspense fallback={<KoryxaCockpitFallback />}>
      <KoryxaCockpitClient />
    </Suspense>
  );
}
