import ModulePageShell from "@/app/school/components/ModulePageShell";
import type { TrackId } from "@/data/school/catalog";
import QuizRunner from "@/app/school/components/quiz/QuizRunner";
import { getModuleQuiz } from "@/app/school/lib/getModuleQuiz";

export default function QuizTab({ trackId, moduleId }: { trackId: TrackId; moduleId: string }) {
  const quiz = getModuleQuiz(trackId, moduleId);

  return (
    <ModulePageShell trackId={trackId} moduleId={moduleId}>
      <h1 className="text-2xl font-semibold text-slate-900">Quiz</h1>
      {quiz ? (
        <div className="mt-6">
          <QuizRunner quiz={quiz} storageKey={`koryxa.school.quiz.${trackId}.${moduleId}.v${quiz.version}`} attemptLimit={3} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">Le quiz de ce module n’est pas encore disponible.</p>
      )}
    </ModulePageShell>
  );
}
