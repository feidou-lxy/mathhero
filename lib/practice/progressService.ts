import { completeDailyTask } from "@/lib/progress/dailyTaskStorage";
import { awardPerfectBonus } from "@/lib/progress/growthStorage";
import type { DailyTaskProgress } from "@/lib/types/dailyTasks";
import type { LevelProgress } from "@/lib/types/growth";
import type { Question, QuestionAnswerResult } from "@/types/math";
import type { PracticeSource, QuestionMode } from "@/lib/practice/types";

export function buildReviewData(
  questions: Question[],
  results: Record<number, QuestionAnswerResult>,
) {
  const correctCount = questions.filter((q) => results[q.id]?.correct).length;
  const totalCount = questions.length;
  const accuracy =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return { correctCount, totalCount, accuracy };
}

export type AdvanceAction =
  | { type: "next_question" }
  | { type: "start_reinforcement" }
  | { type: "finish_review" };

export function getAdvanceAction(
  questionMode: QuestionMode,
  currentIndex: number,
  totalQuestions: number,
  isLastMainQuestion: boolean,
): AdvanceAction {
  if (questionMode === "reinforcement") {
    if (currentIndex < 1) {
      return { type: "next_question" };
    }
    if (isLastMainQuestion) {
      return { type: "finish_review" };
    }
    return { type: "next_question" };
  }

  if (isLastMainQuestion) {
    return { type: "finish_review" };
  }

  return { type: "next_question" };
}

export function completeTaskOnReview(
  taskId: string,
  correctCount: number,
  total: number,
  practiceSource: PracticeSource,
): DailyTaskProgress | null {
  if (practiceSource !== "normal" || total === 0) return null;
  return completeDailyTask(taskId, correctCount / total);
}

export function tryAwardPerfectBonus(
  correctCount: number,
  total: number,
): { levelProgress: LevelProgress; starsAdded: number } | null {
  if (total === 0 || correctCount !== total) return null;
  const result = awardPerfectBonus();
  return {
    levelProgress: result.levelProgress,
    starsAdded: result.starsAdded,
  };
}
