import ModulePageShell from "@/app/school/components/ModulePageShell";
import type { TrackId } from "@/data/school/catalog";

export default function QuizTab({ trackId, moduleId }: { trackId: TrackId; moduleId: string }) {
  return (
    <ModulePageShell trackId={trackId} moduleId={moduleId}>
      <h1 className="text-2xl font-semibold text-slate-900">Quiz</h1>
      <p className="mt-4 text-sm text-slate-600">Le quiz de ce module n’est pas encore disponible.</p>
    </ModulePageShell>
  );
}
