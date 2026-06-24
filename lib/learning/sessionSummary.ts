import type { Question, SessionResult, SessionSummary } from "@/types/math";
import {
  buildTeacherRecommendation,
  buildTeacherSessionComment,
} from "@/lib/ai/teacherCharacter";
import {
  getSkillLabel,
  PROFILE_SKILLS,
  SKILL_LABELS,
  type StudentProfile,
} from "@/types/math";

export type { SessionResult, SessionSummary };

function buildRecommendation(
  wrongLabels: string[],
  profile?: StudentProfile | null,
): string {
  const profileWeak = profile
    ? PROFILE_SKILLS.filter(
        (s) =>
          profile.skills[s].level === "needs_improvement" &&
          profile.skills[s].total > 0,
      ).map((s) => SKILL_LABELS[s])
    : [];

  const profileHint =
    profileWeak.length > 0
      ? `结合你平时的表现，${profileWeak.join("、")}也还需要多巩固。`
      : "";

  return buildTeacherRecommendation(wrongLabels, profileHint);
}

function buildWeakCategoriesText(wrongLabels: string[]): string {
  if (wrongLabels.length === 0) {
    return "本轮各类型都做得不错，没有明显薄弱项！";
  }

  const counts = new Map<string, number>();
  for (const label of wrongLabels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => (count > 1 ? `${label}（错了 ${count} 次）` : label));

  return sorted.join("、");
}

export function buildSessionSummary(
  questions: Question[],
  results: Record<number, SessionResult>,
  profile?: StudentProfile | null,
): SessionSummary {
  const totalCount = questions.length;
  let correctCount = 0;
  const wrongCategoryLabels: string[] = [];

  for (const question of questions) {
    const result = results[question.id];
    if (!result) continue;

    if (result.correct) {
      correctCount += 1;
    } else {
      wrongCategoryLabels.push(getSkillLabel(question.category));
    }
  }

  const uniqueWrong = [...new Set(wrongCategoryLabels)];
  const weakCategoriesText = buildWeakCategoriesText(wrongCategoryLabels);
  const recommendation = buildRecommendation(wrongCategoryLabels, profile);
  const comment = buildTeacherSessionComment(correctCount, totalCount);

  return {
    correctCount,
    totalCount,
    wrongCategoryLabels: uniqueWrong,
    weakCategoriesText,
    recommendation,
    comment,
  };
}

/** 汇总本轮各知识点表现（按实际题目 category） */
export function getSessionSkillBreakdown(
  questions: Question[],
  results: Record<number, SessionResult>,
): Array<{ label: string; correct: number; total: number }> {
  const map = new Map<string, { correct: number; total: number }>();

  for (const question of questions) {
    const result = results[question.id];
    if (!result) continue;

    const label = getSkillLabel(question.category);
    const entry = map.get(label) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (result.correct) entry.correct += 1;
    map.set(label, entry);
  }

  return [...map.entries()].map(([label, stats]) => ({ label, ...stats }));
}
