import type { PracticeSet } from "@/types/math";
import type { QuestionMode } from "@/lib/practice/types";

export function getLevelLabel(level?: PracticeSet["level"]): string {
  if (level === "transition") return "升二年级过渡 + 二年级";
  if (level === 1) return "一年级";
  if (level === 2) return "二年级";
  return "";
}

export function getNextButtonLabel(
  questionMode: QuestionMode,
  isLastReinforcement: boolean,
  isLastMainQuestion: boolean,
): string {
  if (questionMode === "reinforcement") {
    if (isLastReinforcement) {
      return isLastMainQuestion ? "完成练习" : "进入下一题";
    }
    return "继续巩固";
  }
  return isLastMainQuestion ? "完成练习" : "下一题";
}

export function getProgressLabel(
  questionMode: QuestionMode,
  currentIndex: number,
  total: number,
  reinforcementIndex: number,
  reinforcementTotal: number,
): string {
  if (questionMode === "main") {
    return `第 ${currentIndex + 1} / ${total} 题`;
  }
  return `巩固练习 ${reinforcementIndex + 1} / ${reinforcementTotal}`;
}

export function getProgressPercent(
  questionMode: QuestionMode,
  currentIndex: number,
  total: number,
  reinforcementIndex: number,
  reinforcementTotal: number,
): number {
  if (questionMode === "main") {
    return total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  }
  return ((reinforcementIndex + 1) / reinforcementTotal) * 100;
}
