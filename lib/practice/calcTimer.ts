import type { Question, QuestionCategory } from "@/types/math";
import { isChoiceQuestion } from "@/lib/practice/questionPresentation";

/** 计算题答题倒计时（秒） */
export const CALC_TIMER_SECONDS = 30;

/** 四则运算 + 巧算 */
export const CALCULATION_CATEGORIES = new Set<QuestionCategory>([
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "clever_calc",
]);

export function isCalculationCategory(category: QuestionCategory): boolean {
  return CALCULATION_CATEGORIES.has(category);
}

export function isCalculationQuestion(question: Question): boolean {
  if (isChoiceQuestion(question)) return false;
  return isCalculationCategory(question.category);
}

export function formatResponseSeconds(ms: number): string {
  const seconds = Math.round(ms / 100) / 10;
  return Number.isInteger(seconds) ? `${seconds}` : seconds.toFixed(1);
}

export function getSpeedLabel(avgSeconds: number): "很快" | "正常" | "偏慢" {
  if (avgSeconds <= 15) return "很快";
  if (avgSeconds <= 25) return "正常";
  return "偏慢";
}
