import "server-only";

import type { TrackId } from "@/data/school/catalog";
import module1Quiz from "@/data/school/data-analyst/module-1/quiz.json";
import module2Quiz from "@/data/school/data-analyst/module-2/quiz.json";
import module3Quiz from "@/data/school/data-analyst/module-3/quiz.json";
import module4Quiz from "@/data/school/data-analyst/module-4/quiz.json";
import module5Quiz from "@/data/school/data-analyst/module-5/quiz.json";
import type { QuizConfig } from "@/app/school/components/quiz/QuizRunner";

export function getModuleQuiz(trackId: TrackId, moduleId: string): QuizConfig | null {
  if (trackId === "data-analyst" && moduleId === "module-1") return module1Quiz as QuizConfig;
  if (trackId === "data-analyst" && moduleId === "module-2") return module2Quiz as QuizConfig;
  if (trackId === "data-analyst" && moduleId === "module-3") return module3Quiz as QuizConfig;
  if (trackId === "data-analyst" && moduleId === "module-4") return module4Quiz as QuizConfig;
  if (trackId === "data-analyst" && moduleId === "module-5") return module5Quiz as QuizConfig;
  return null;
}
