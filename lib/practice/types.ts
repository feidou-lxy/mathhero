import type { PracticeSet } from "@/types/math";

export type PracticePhase = "answering" | "review";

export type QuestionMode = "main" | "reinforcement";

export type PracticeSource = "normal" | "mistake_single" | "mistakes_drill";

export type PracticeSearchParams = {
  taskId: string | null;
  mistakeId: string | null;
  mode: string | null;
};

export const PRACTICE_LEVEL = 2 as const;

export const REINFORCEMENT_TOTAL = 2;

export function resolvePracticeSource(params: PracticeSearchParams): PracticeSource {
  if (params.mistakeId) return "mistake_single";
  if (params.mode === "mistakes_drill") return "mistakes_drill";
  return "normal";
}

export function getPracticeSubtitle(
  source: PracticeSource,
  practiceSet: PracticeSet | null,
  levelLabel: (level?: PracticeSet["level"]) => string,
): string {
  if (source === "mistake_single") return "错题重新练习";
  if (source === "mistakes_drill") return "错题专项训练";
  if (practiceSet) {
    return `${practiceSet.date} · ${levelLabel(practiceSet.level)} · 二年级完整体系`;
  }
  return "正在加载今日练习题…";
}
