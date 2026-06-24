import type { QuestionCategory, StudentProfile } from "@/types/math";
import type { ProfileSkill } from "@/types/math";
import type { DifficultyTier } from "@/lib/profile/generationPlan";

/** 除法、应用题 — 重点训练，权重更高 */
export const FOCUS_TRAINING_SKILLS: ProfileSkill[] = [
  "division",
  "two_step_word",
];

export const CALC_CATEGORIES: QuestionCategory[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
];

export const APPLICATION_CATEGORIES: QuestionCategory[] = [
  "two_step_word",
  "time_money",
  "multi_step_word",
];

export const THINKING_CATEGORIES: QuestionCategory[] = [
  "pattern_sequence",
  "logic_reasoning",
  "shape_pattern",
  "clever_calc",
];

export type AdvancedDifficultyTier = "easy" | "medium" | "hard";

export type DifficultyBalance = {
  /** 基础题（6 类 basic category）历史正确率 */
  basicAccuracy: number;
  basicHasHistory: boolean;
  /** 基础题数字/情境难度 */
  basicTier: DifficultyTier;
  basicTierLabel: string;
  /** 拓展题（浅奥）思维难度 — 由基础题表现驱动 */
  advancedTier: AdvancedDifficultyTier;
  advancedTierLabel: string;
  /** 除法 / 应用题等重点加强项 */
  focusSkills: ProfileSkill[];
};

const BASIC_SKILLS: ProfileSkill[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "two_step_word",
  "time_money",
];

const BASIC_TIER_LABELS: Record<DifficultyTier, string> = {
  easy: "偏低（基础题更多练）",
  medium: "适中",
  hard: "偏高（基础题挑战）",
};

const ADVANCED_TIER_LABELS: Record<AdvancedDifficultyTier, string> = {
  easy: "偏低（拓展题思维难度降低）",
  medium: "适中",
  hard: "偏高（拓展题思维挑战加强）",
};

export function getBasicAccuracy(profile: StudentProfile): {
  accuracy: number;
  hasHistory: boolean;
} {
  let correct = 0;
  let total = 0;

  for (const skill of BASIC_SKILLS) {
    correct += profile.skills[skill].correct;
    total += profile.skills[skill].total;
  }

  if (total === 0) {
    return { accuracy: 50, hasHistory: false };
  }

  return {
    accuracy: Math.round((correct / total) * 100),
    hasHistory: true,
  };
}

/** 基础题错误多 → 降低基础难度 */
export function getBasicDifficultyTier(
  basicAccuracy: number,
  hasHistory: boolean,
): DifficultyTier {
  if (!hasHistory) return "medium";
  if (basicAccuracy >= 80) return "hard";
  if (basicAccuracy < 45) return "easy";
  if (basicAccuracy < 55) return "easy";
  return "medium";
}

/** 基础题正确率高 → 提高拓展题难度；错误多 → 降低拓展题难度 */
export function getAdvancedDifficultyTier(
  basicAccuracy: number,
  hasHistory: boolean,
): AdvancedDifficultyTier {
  if (!hasHistory) return "medium";
  if (basicAccuracy >= 75) return "hard";
  if (basicAccuracy < 50) return "easy";
  return "medium";
}

export function getFocusTrainingSkills(profile: StudentProfile): ProfileSkill[] {
  const focus: ProfileSkill[] = [];

  for (const skill of FOCUS_TRAINING_SKILLS) {
    const stats = profile.skills[skill];
    if (stats.total === 0 || stats.level !== "proficient") {
      focus.push(skill);
    }
  }

  if (focus.length === 0) {
    const divisionAcc = profile.skills.division.accuracy;
    const wordAcc = profile.skills.two_step_word.accuracy;
    if (divisionAcc <= wordAcc) {
      focus.push("division");
    } else {
      focus.push("two_step_word");
    }
  }

  return focus;
}

export function isSkillWeak(profile: StudentProfile, skill: ProfileSkill): boolean {
  const stats = profile.skills[skill];
  return (
    stats.total === 0 ||
    stats.level === "needs_improvement" ||
    (stats.total > 0 && stats.accuracy < 60)
  );
}

export function computeDifficultyBalance(
  profile: StudentProfile,
): DifficultyBalance {
  const { accuracy, hasHistory } = getBasicAccuracy(profile);
  const basicTier = getBasicDifficultyTier(accuracy, hasHistory);
  const advancedTier = getAdvancedDifficultyTier(accuracy, hasHistory);

  return {
    basicAccuracy: accuracy,
    basicHasHistory: hasHistory,
    basicTier,
    basicTierLabel: BASIC_TIER_LABELS[basicTier],
    advancedTier,
    advancedTierLabel: ADVANCED_TIER_LABELS[advancedTier],
    focusSkills: getFocusTrainingSkills(profile),
  };
}

export function validateSessionCoverage(slots: { category: QuestionCategory }[]): string | null {
  const categories = slots.map((s) => s.category);

  const hasCalc = CALC_CATEGORIES.some((c) => categories.includes(c));
  const hasApplication = APPLICATION_CATEGORIES.some((c) => categories.includes(c));
  const hasThinking = THINKING_CATEGORIES.some((c) => categories.includes(c));

  if (!hasCalc) {
    return "Session must include calculation questions (addition/subtraction/multiplication/division)";
  }
  if (!hasApplication) {
    return "Session must include word/application questions";
  }
  if (!hasThinking) {
    return "Session must include thinking questions (pattern/logic/shape/clever_calc)";
  }

  return null;
}
