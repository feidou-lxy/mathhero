import {
  isBasicCategory,
  isExtensionCategory,
} from "@/lib/curriculum/grade2";
import type {
  SkillGroupMastery,
  SkillMasteryItem,
  SkillMasteryView,
} from "@/lib/types/mastery";
import {
  LEVEL_LABELS,
  PROFILE_SKILLS,
  SKILL_LABELS,
  type ProfileSkill,
  type StudentProfile,
} from "@/lib/types/profile";

const SKILL_GROUPS: Array<{
  id: SkillGroupMastery["id"];
  label: string;
  skills: ProfileSkill[];
}> = [
  {
    id: "calculation",
    label: "计算能力",
    skills: ["addition", "subtraction", "multiplication", "division"],
  },
  {
    id: "application",
    label: "应用能力",
    skills: ["two_step_word", "time_money", "multi_step_word"],
  },
  {
    id: "thinking",
    label: "思维能力",
    skills: [
      "pattern_sequence",
      "logic_reasoning",
      "shape_pattern",
      "clever_calc",
    ],
  },
];

export function parseFocusSkillParam(
  param: string | null,
): ProfileSkill | null {
  if (!param) return null;
  return PROFILE_SKILLS.includes(param as ProfileSkill)
    ? (param as ProfileSkill)
    : null;
}

export function computeWeaknessScore(
  accuracy: number,
  total: number,
  level: SkillMasteryItem["level"],
): number {
  if (total === 0) return 55;

  let score = 100 - accuracy;
  if (level === "needs_improvement") score += 12;
  if (level === "proficient") score -= 15;
  if (total < 3) score += 5;

  return Math.max(0, Math.round(score));
}

function buildSkillItem(
  profile: StudentProfile,
  skill: ProfileSkill,
): SkillMasteryItem {
  const stats = profile.skills[skill];
  const practiced = stats.total > 0;

  return {
    skill,
    label: SKILL_LABELS[skill],
    accuracy: stats.accuracy,
    level: stats.level,
    levelLabel: stats.levelLabel ?? LEVEL_LABELS[stats.level],
    correct: stats.correct,
    total: stats.total,
    practiced,
    weaknessScore: computeWeaknessScore(stats.accuracy, stats.total, stats.level),
  };
}

function buildGroupMastery(
  profile: StudentProfile,
  group: (typeof SKILL_GROUPS)[number],
): SkillGroupMastery {
  let correct = 0;
  let total = 0;
  let practicedCount = 0;

  for (const skill of group.skills) {
    const stats = profile.skills[skill];
    correct += stats.correct;
    total += stats.total;
    if (stats.total > 0) practicedCount += 1;
  }

  return {
    id: group.id,
    label: group.label,
    skills: group.skills,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    practicedCount,
    totalCount: group.skills.length,
  };
}

export function buildSkillMasteryView(
  profile: StudentProfile,
): SkillMasteryView {
  const items = PROFILE_SKILLS.map((skill) => buildSkillItem(profile, skill));

  let totalCorrect = 0;
  let totalAttempts = 0;
  let practicedSkillCount = 0;

  for (const item of items) {
    totalCorrect += item.correct;
    totalAttempts += item.total;
    if (item.practiced) practicedSkillCount += 1;
  }

  const weakRanking = [...items]
    .filter((item) => item.practiced || item.weaknessScore >= 55)
    .sort((a, b) => {
      if (b.weaknessScore !== a.weaknessScore) {
        return b.weaknessScore - a.weaknessScore;
      }
      return a.accuracy - b.accuracy;
    });

  const strongRanking = [...items]
    .filter((item) => item.practiced && item.level === "proficient")
    .sort((a, b) => b.accuracy - a.accuracy);

  return {
    items,
    weakRanking,
    strongRanking,
    overallMasteryRate:
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    practicedSkillCount,
    totalSkillCount: PROFILE_SKILLS.length,
    groups: SKILL_GROUPS.map((group) => buildGroupMastery(profile, group)),
  };
}

export function getTopWeakSkills(
  profile: StudentProfile,
  limit = 3,
): ProfileSkill[] {
  return buildSkillMasteryView(profile)
    .weakRanking.slice(0, limit)
    .map((item) => item.skill);
}

/** 题目 category 即知识点标签 */
export function getQuestionSkillTag(category: ProfileSkill): string {
  return SKILL_LABELS[category];
}

export function getSkillTagType(
  category: ProfileSkill,
): "basic" | "extension" {
  if (isExtensionCategory(category)) return "extension";
  if (isBasicCategory(category)) return "basic";
  return "basic";
}
