import "server-only";

import type { TrackId } from "@/data/school/catalog";
import module1Quiz from "@/data/school/data-analyst/module-1/quiz.json";
import module2Quiz from "@/data/school/data-analyst/module-2/quiz.json";
import module3Quiz from "@/data/school/data-analyst/module-3/quiz.json";
import module4Quiz from "@/data/school/data-analyst/module-4/quiz.json";
import module5Quiz from "@/data/school/data-analyst/module-5/quiz.json";
import module6Quiz from "@/data/school/data-analyst/module-6/quiz.json";
import type { QuizConfig } from "@/app/school/components/quiz/QuizRunner";

type QuizConfigLegacy = {
  module?: string;
  format?: string;
  pass_score_pct?: number;
  total_questions?: number;
  questions?: Array<{
    id: string;
    question: string;
    choices: Record<string, string>;
    answer: string;
    rationale?: string;
  }>;
};

function normalizeQuizConfig(input: unknown): QuizConfig | null {
  if (!input || typeof input !== "object") return null;

  if ("pass_threshold" in input) return input as QuizConfig;

  const legacy = input as QuizConfigLegacy;
  if (!Array.isArray(legacy.questions) || legacy.questions.length === 0) return null;

  const normalizedQuestions: QuizConfig["questions"] = legacy.questions.map((q) => {
    const choiceKeys = ["A", "B", "C", "D"].filter((k) => q.choices && typeof q.choices[k] === "string");
    const choices = choiceKeys.map((k) => q.choices[k]);
    const answerIndex = Math.max(0, choiceKeys.indexOf(q.answer));

    return {
      id: q.id,
      type: "single_choice",
      prompt: q.question,
      choices,
      answer_index: answerIndex,
      explanation: q.rationale ?? "",
    };
  });

  const passThresholdPct = typeof legacy.pass_score_pct === "number" ? legacy.pass_score_pct : 80;

  return {
    module: legacy.module ?? "Quiz",
    version: "1.0.0",
    pass_threshold: passThresholdPct / 100,
    grading: { points_per_question: 1, negative_marking: false },
    delivery: { shuffle_questions: true, shuffle_choices: true, time_limit_minutes: 60 },
    questions: normalizedQuestions,
  };
}

export function getModuleQuiz(trackId: TrackId, moduleId: string): QuizConfig | null {
  if (trackId === "data-analyst" && moduleId === "module-1") return module1Quiz as QuizConfig;
  if (trackId === "data-analyst" && moduleId === "module-2") return module2Quiz as QuizConfig;
  if (trackId === "data-analyst" && moduleId === "module-3") return module3Quiz as QuizConfig;
  if (trackId === "data-analyst" && moduleId === "module-4") return module4Quiz as QuizConfig;
  if (trackId === "data-analyst" && moduleId === "module-5") return module5Quiz as QuizConfig;
  if (trackId === "data-analyst" && moduleId === "module-6") return normalizeQuizConfig(module6Quiz);
  return null;
}
