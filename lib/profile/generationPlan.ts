import type { PracticeLevel } from "@/lib/types/practice";
import {
  allocateGrade2TopicSlots,
  GRADE2_FIXED_ADVANCED_COUNT,
  GRADE2_FIXED_BASIC_COUNT,
  type TopicSlot,
} from "@/lib/curriculum/grade2";
import {
  allocatePathWeekTopicSlots,
  getWeekConfig,
  type LearningPathWeekConfig,
} from "@/lib/curriculum/learningPathConfig";
import { allocateWeakSkillTopicSlots } from "@/lib/mastery/weakSkillSlots";
import {
  buildSkillMasteryView,
  getTopWeakSkills,
} from "@/lib/mastery/skillMastery";
import type { SkillMasteryView } from "@/lib/types/mastery";
import {
  computeDifficultyBalance,
  type DifficultyBalance,
} from "@/lib/curriculum/difficultyBalance";
import {
  PROFILE_SKILLS,
  SKILL_LABELS,
  type ProfileSkill,
  type StudentProfile,
} from "@/lib/types/profile";
import { createEmptyProfile } from "@/lib/profile/studentProfile";
import { getTodayDateString } from "@/lib/ai/mockQuestions";

export type DifficultyTier = "easy" | "medium" | "hard";

export type GenerationPlan = {
  total: number;
  basicCount: number;
  /** 拓展题（浅奥）数量 */
  wordProblemCount: number;
  difficultyTier: DifficultyTier;
  difficultyLabel: string;
  overallAccuracy: number;
  hasHistory: boolean;
  weakSkills: ProfileSkill[];
  strongSkills: ProfileSkill[];
  /** 二年级难度平衡 */
  balance?: DifficultyBalance;
  /** 二年级：每道题的固定类型与知识点 */
  topicSlots?: TopicSlot[];
  /** 学习路径周次（1-12） */
  pathWeek?: number;
  pathWeekConfig?: LearningPathWeekConfig;
  /** 薄弱专项知识点 */
  focusSkill?: ProfileSkill;
  /** 知识点掌握全景（用于 AI 策略） */
  masteryView?: SkillMasteryView;
  /** 薄弱项排序（最薄弱在前） */
  weakSkillsRanked: ProfileSkill[];
  /** transition 模式专用 */
  transitionBasic: number;
  grade2Basic: number;
  transitionWordProblem: number;
  grade2WordProblem: number;
};

const TOTAL = 7;

function getOverallAccuracy(profile: StudentProfile): {
  accuracy: number;
  hasHistory: boolean;
} {
  let correct = 0;
  let total = 0;

  for (const skill of PROFILE_SKILLS) {
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

function getDifficultyTier(
  profile: StudentProfile,
  overallAccuracy: number,
): DifficultyTier {
  const weakSkills = PROFILE_SKILLS.filter(
    (s) =>
      profile.skills[s].total >= 2 &&
      profile.skills[s].level === "needs_improvement",
  );
  const strongSkills = PROFILE_SKILLS.filter(
    (s) =>
      profile.skills[s].total >= 3 && profile.skills[s].level === "proficient",
  );

  if (weakSkills.length >= 2 || overallAccuracy < 40) return "easy";
  if (strongSkills.length >= 2 && overallAccuracy >= 68) return "hard";
  if (overallAccuracy >= 62) return "hard";
  if (overallAccuracy >= 48) return "medium";
  return "easy";
}

function getLegacyWordProblemCount(profile: StudentProfile): number {
  const wp = profile.skills.two_step_word;

  if (wp.total === 0) return 2;

  if (wp.level === "proficient" && wp.accuracy >= 80) return 3;
  if (wp.level === "needs_improvement") return 1;
  return 2;
}

function splitTransitionWordProblems(count: number): {
  transition: number;
  grade2: number;
} {
  if (count <= 0) return { transition: 0, grade2: 0 };
  if (count === 1) return { transition: 1, grade2: 0 };
  if (count === 2) return { transition: 1, grade2: 1 };
  return { transition: 2, grade2: 1 };
}

function splitTransitionBasic(
  basicCount: number,
  tier: DifficultyTier,
): { transition: number; grade2: number } {
  if (basicCount <= 0) return { transition: 0, grade2: 0 };
  if (basicCount === 1) return { transition: 1, grade2: 0 };

  const transitionRatio =
    tier === "easy" ? 0.7 : tier === "hard" ? 0.45 : 0.6;
  const transition = Math.max(1, Math.round(basicCount * transitionRatio));
  const grade2 = Math.max(0, basicCount - transition);

  return { transition, grade2: grade2 === 0 && basicCount > 1 ? 1 : grade2 };
}

const TIER_LABELS: Record<DifficultyTier, string> = {
  easy: "偏低（更多基础练）",
  medium: "适中",
  hard: "偏高（更多挑战）",
};

export function buildGenerationPlan(
  profile?: StudentProfile,
  level: PracticeLevel = 2,
  date?: string,
  pathWeek?: number,
  focusSkill?: ProfileSkill,
): GenerationPlan {
  const p = profile ?? createEmptyProfile();
  const { accuracy, hasHistory } = getOverallAccuracy(p);
  const balance = level === 2 ? computeDifficultyBalance(p) : undefined;
  const masteryView = level === 2 ? buildSkillMasteryView(p) : undefined;
  const weakSkillsRanked =
    level === 2 ? getTopWeakSkills(p, PROFILE_SKILLS.length) : [];
  const difficultyTier =
    level === 2 && balance ? balance.basicTier : getDifficultyTier(p, accuracy);

  const extensionCount =
    level === 2 ? GRADE2_FIXED_ADVANCED_COUNT : getLegacyWordProblemCount(p);
  const basicCount =
    level === 2 ? GRADE2_FIXED_BASIC_COUNT : TOTAL - extensionCount;

  const weakSkills = PROFILE_SKILLS.filter(
    (s) => p.skills[s].level === "needs_improvement" && p.skills[s].total > 0,
  );
  const strongSkills = PROFILE_SKILLS.filter(
    (s) => p.skills[s].level === "proficient" && p.skills[s].total > 0,
  );

  const wpSplit = splitTransitionWordProblems(extensionCount);
  const basicSplit = splitTransitionBasic(basicCount, difficultyTier);

  const planDate = date ?? getTodayDateString();
  const pathWeekConfig =
    pathWeek !== undefined ? getWeekConfig(pathWeek) ?? undefined : undefined;
  const pathSlots =
    pathWeekConfig !== undefined
      ? allocatePathWeekTopicSlots(pathWeekConfig.weekNumber)
      : null;

  const resolvedFocusSkill =
    focusSkill && PROFILE_SKILLS.includes(focusSkill) ? focusSkill : undefined;

  const weakSkillSlots =
    level === 2 && resolvedFocusSkill && balance
      ? allocateWeakSkillTopicSlots(p, resolvedFocusSkill, planDate, balance)
      : null;

  const topicSlots =
    level === 2 && pathSlots
      ? pathSlots
      : level === 2 && weakSkillSlots
        ? weakSkillSlots
        : level === 2 && balance
          ? allocateGrade2TopicSlots(
              p,
              basicCount,
              extensionCount,
              planDate,
              balance,
            )
          : level === 2
            ? allocateGrade2TopicSlots(p, basicCount, extensionCount, planDate)
            : undefined;

  return {
    total: TOTAL,
    basicCount,
    wordProblemCount: extensionCount,
    difficultyTier,
    difficultyLabel: TIER_LABELS[difficultyTier],
    overallAccuracy: accuracy,
    hasHistory,
    weakSkills,
    strongSkills,
    balance,
    pathWeek: pathWeekConfig?.weekNumber,
    pathWeekConfig,
    focusSkill: resolvedFocusSkill,
    masteryView,
    weakSkillsRanked,
    topicSlots,
    transitionBasic: basicSplit.transition,
    grade2Basic: basicSplit.grade2,
    transitionWordProblem: wpSplit.transition,
    grade2WordProblem: wpSplit.grade2,
  };
}

export function getProfileFingerprint(profile?: StudentProfile): string {
  if (!profile) return "default";
  return PROFILE_SKILLS.map(
    (s) => `${s}:${profile.skills[s].correct}/${profile.skills[s].total}`,
  ).join("|");
}

export function formatSkillList(skills: ProfileSkill[]): string {
  if (skills.length === 0) return "无";
  return skills.map((s) => SKILL_LABELS[s]).join("、");
}
