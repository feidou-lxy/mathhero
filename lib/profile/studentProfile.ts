import { migrateLegacySkillStats } from "@/lib/curriculum/grade2";
import { isCalculationCategory } from "@/lib/practice/calcTimer";
import type { QuestionCategory } from "@/lib/types/practice";
import {
  LEVEL_LABELS,
  PROFILE_SKILLS,
  SKILL_LABELS,
  type ProfileSkill,
  type RecordAnswerInput,
  type SkillLevel,
  type SkillStats,
  type StudentProfile,
} from "@/lib/types/profile";

const DEFAULT_STUDENT_ID = "default";

function emptySkillStats(): SkillStats {
  return {
    correct: 0,
    total: 0,
    accuracy: 0,
    level: "average",
    levelLabel: LEVEL_LABELS.average,
    responseTimeMs: 0,
    responseTimeCount: 0,
  };
}

function createEmptySkills(): Record<ProfileSkill, SkillStats> {
  return Object.fromEntries(
    PROFILE_SKILLS.map((skill) => [skill, emptySkillStats()]),
  ) as Record<ProfileSkill, SkillStats>;
}

export function createEmptyProfile(studentId = DEFAULT_STUDENT_ID): StudentProfile {
  return {
    studentId,
    updatedAt: new Date().toISOString(),
    skills: createEmptySkills(),
  };
}

/** 题目 category 即知识点，直接对应 */
export function categoryToSkill(category: QuestionCategory): ProfileSkill {
  return category;
}

export function judgeSkillLevel(correct: number, total: number): SkillLevel {
  if (total === 0) return "average";

  const accuracy = (correct / total) * 100;

  if (accuracy >= 80) return "proficient";
  if (accuracy >= 50) return "average";
  return "needs_improvement";
}

function buildSkillStats(
  correct: number,
  total: number,
  responseTimeMs = 0,
  responseTimeCount = 0,
): SkillStats {
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const level = judgeSkillLevel(correct, total);

  return {
    correct,
    total,
    accuracy,
    level,
    levelLabel: LEVEL_LABELS[level],
    responseTimeMs,
    responseTimeCount,
  };
}

export function recordProfileAnswer(
  profile: StudentProfile,
  input: RecordAnswerInput,
): StudentProfile {
  const skill = categoryToSkill(input.category);
  const current = profile.skills[skill] ?? emptySkillStats();
  const correct = current.correct + (input.isCorrect ? 1 : 0);
  const total = current.total + 1;

  let responseTimeMs = current.responseTimeMs ?? 0;
  let responseTimeCount = current.responseTimeCount ?? 0;

  if (
    isCalculationCategory(input.category) &&
    typeof input.responseTimeMs === "number" &&
    input.responseTimeMs >= 0
  ) {
    responseTimeCount += 1;
    responseTimeMs += input.responseTimeMs;
  }

  return {
    ...profile,
    updatedAt: new Date().toISOString(),
    skills: {
      ...profile.skills,
      [skill]: buildSkillStats(
        correct,
        total,
        responseTimeMs,
        responseTimeCount,
      ),
    },
  };
}

export function getPracticedSkills(profile: StudentProfile): ProfileSkill[] {
  return PROFILE_SKILLS.filter((skill) => profile.skills[skill].total > 0);
}

export function formatProfileSkillSummary(profile: StudentProfile): string {
  const practiced = getPracticedSkills(profile);
  if (practiced.length === 0) return "暂无历史练习记录。";

  return practiced
    .map(
      (skill) =>
        `${SKILL_LABELS[skill]} ${profile.skills[skill].levelLabel}（${profile.skills[skill].accuracy}%）`,
    )
    .join("，");
}

export function normalizeProfile(data: unknown): StudentProfile {
  const base = createEmptyProfile();

  if (!data || typeof data !== "object") return base;

  const record = data as Partial<StudentProfile>;
  const skills = record.skills;

  if (!skills || typeof skills !== "object") {
    return { ...base, studentId: record.studentId ?? base.studentId };
  }

  const rawSkills: Record<
    string,
    {
      correct: number;
      total: number;
      responseTimeMs?: number;
      responseTimeCount?: number;
    }
  > = {};
  for (const [key, value] of Object.entries(skills)) {
    if (!value || typeof value !== "object") continue;
    const stat = value as Partial<SkillStats>;
    rawSkills[key] = {
      correct: typeof stat.correct === "number" ? stat.correct : 0,
      total: typeof stat.total === "number" ? stat.total : 0,
      responseTimeMs:
        typeof stat.responseTimeMs === "number" ? stat.responseTimeMs : 0,
      responseTimeCount:
        typeof stat.responseTimeCount === "number" ? stat.responseTimeCount : 0,
    };
  }

  const migrated = migrateLegacySkillStats(rawSkills);

  for (const skill of PROFILE_SKILLS) {
    const stats = migrated[skill];
    if (!stats) continue;
    base.skills[skill] = buildSkillStats(
      stats.correct,
      stats.total,
      stats.responseTimeMs ?? 0,
      stats.responseTimeCount ?? 0,
    );
  }

  return {
    studentId: record.studentId ?? base.studentId,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
    skills: base.skills,
  };
}
