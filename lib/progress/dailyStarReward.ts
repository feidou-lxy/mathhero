import { isCalculationQuestion } from "@/lib/practice/calcTimer";
import type { Question } from "@/types/math";

export const DAILY_MAIN_TASK_ID = "daily_main";
export const DAILY_MAIN_QUESTION_COUNT = 7;

export type DailySessionStarContext = {
  correctCount: number;
  allAnsweredInTime: boolean;
  stars: number;
};

export function isDailyMainSession(
  activeTaskId: string | null,
  questionCount: number,
): boolean {
  return activeTaskId === DAILY_MAIN_TASK_ID && questionCount === DAILY_MAIN_QUESTION_COUNT;
}

/** 计算题须在倒计时内作答；选择题/应用题无倒计时限制 */
export function allMainQuestionsAnsweredInTime(
  questions: Question[],
  metrics: Record<number, { timedOut?: boolean }>,
): boolean {
  for (const question of questions) {
    if (!isCalculationQuestion(question)) continue;
    if (metrics[question.id]?.timedOut) return false;
  }
  return true;
}

export function getDailySessionStarReward(
  correctCount: number,
  allAnsweredInTime: boolean,
): number {
  if (!allAnsweredInTime) return 0;
  if (correctCount >= 7) return 5;
  if (correctCount === 6) return 4;
  if (correctCount === 5) return 3;
  if (correctCount === 4) return 2;
  if (correctCount === 3) return 1;
  return 0;
}

export function buildDailySessionStarContext(
  questions: Question[],
  results: Record<number, { correct?: boolean }>,
  metrics: Record<number, { timedOut?: boolean }>,
): DailySessionStarContext {
  const correctCount = questions.filter((q) => results[q.id]?.correct === true).length;
  const allAnsweredInTime = allMainQuestionsAnsweredInTime(questions, metrics);
  const stars = getDailySessionStarReward(correctCount, allAnsweredInTime);

  return { correctCount, allAnsweredInTime, stars };
}
