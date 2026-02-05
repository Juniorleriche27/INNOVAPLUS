import type { ReactNode } from "react";
import ModuleTabs from "@/app/school/components/ModuleTabs";
import { getTrack, type TrackId } from "@/data/school/catalog";

export default function ModulePageShell({
  trackId,
  moduleId,
  children,
}: {
  trackId: TrackId;
  moduleId: string;
  children: ReactNode;
}) {
  const track = getTrack(trackId);
  const moduleMeta = track?.modules.find((m) => m.id === moduleId);
  const baseHref = trackId === "fundamental" ? moduleMeta?.href ?? "/school" : `/school/${trackId}/${moduleId}`;

  return (
    <div className="space-y-4">
      {trackId === "fundamental" ? null : <ModuleTabs baseHref={baseHref} />}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {children}
      </section>
    </div>
  );
}

