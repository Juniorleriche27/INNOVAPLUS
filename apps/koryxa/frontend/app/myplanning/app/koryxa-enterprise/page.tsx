import { Suspense } from "react";

import KoryxaEnterpriseCockpitClient from "./KoryxaEnterpriseCockpitClient";

function KoryxaEnterpriseCockpitFallback() {
  return (
    <section className="grid gap-4">
      <div className="h-28 animate-pulse rounded-[32px] bg-white" />
      <div className="h-48 animate-pulse rounded-[32px] bg-white" />
    </section>
  );
}

export default function KoryxaEnterpriseCockpitPage() {
  return (
    <Suspense fallback={<KoryxaEnterpriseCockpitFallback />}>
      <KoryxaEnterpriseCockpitClient />
    </Suspense>
  );
}
